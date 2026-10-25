/**
 * Simulateur de prix v2 — trois parcours dédiés.
 *
 * Une question par écran, avancement automatique au clic, puis un mini-devis
 * indicatif par poste. Les questions ne vivent pas ici : elles sont décrites
 * dans `config.ts` (QUESTIONS + SEQUENCES) et rendues par le même écran
 * générique. Ajouter ou retirer une question ne demande donc aucune ligne de
 * composant.
 *
 *   - /simulateur                  → le parcours est demandé à l'étape 1 ;
 *   - /simulateur?besoin=borne     → parcours borne direct (étape 1 sautée) ;
 *   - /simulateur?besoin=rgie      → parcours conformité direct ;
 *   - /simulateur?besoin=depannage → redirigé vers la page dépannage (Simulateur.tsx).
 *
 * Le dépannage est à part : il ne pose aucune question en séquence, ne demande
 * aucune coordonnée et n'enregistre aucun lead (arbitrages du 2026-09-13). Tout
 * y tient sur un écran unique — contrôle de sécurité, prix plancher lisible
 * sans le moindre clic, puis deux sélecteurs qui l'affinent en direct — parce
 * que quelqu'un dont l'installation vient de lâcher n'enchaîne pas trois écrans
 * avant de voir un prix.
 *
 * Le calcul est intégralement local (voir lib/simulateur/calcul.ts) : le
 * réseau n'est sollicité qu'au moment de l'envoi, une fois les coordonnées
 * saisies.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Lock, ImagePlus, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";
import { useDisplayRating } from "@/hooks/useDisplayRating";
import LogoIcon from "@/components/LogoIcon";
import {
  CHAMP_MODELE_BORNE,
  CHOIX_PARCOURS,
  CLE_SESSION_ENVOI,
  DELAI_SUSPECT_MS,
  MENTIONS,
  NB_QUESTIONS,
  PARCOURS,
  PAGE_DEPANNAGE,
  PARCOURS_OBSOLETES,
  PREFERENCES_RAPPEL,
  QUESTIONS,
  REGEX_EMAIL,
  REGEX_GSM_BELGE,
  SEQUENCES,
  UPLOAD,
  nettoyerGsm,
  saisirGsm,
  type AgeLogement,
  type Distance,
  type EtatTableau,
  type Fournisseur,
  type IdQuestion,
  type NombreTableaux,
  type Parcours,
  type PreferenceRappel,
  type Usage,
  type ContexteRgie,
} from "@/lib/simulateur/config";
import { calculerDevis, formatFourchette, type Reponses } from "@/lib/simulateur/calcul";
import { envoyerSimulation } from "@/lib/simulateur/submit";
import { ChoiceCard, MentionBox, ProgressBar, StepShell } from "./SimulateurUI";
import { EcranComplexe, EcranDevis } from "./SimulateurResultat";

type Etape = "parcours" | IdQuestion | "capture" | "resultat";

/**
 * Premier écran d'un parcours. Jamais appelé pour le dépannage : l'étape 1 et
 * `?besoin=depannage` renvoient vers la page dépannage avant d'arriver ici.
 */
const premierEcran = (p: Parcours): Etape => SEQUENCES[p][0];

/** Seul le dépannage se termine sans demander de coordonnées. */
const DEMANDE_COORDONNEES: Record<Parcours, boolean> = {
  borne: true,
  rgie: true,
  depannage: false,
};

/**
 * Dénominateur de la barre de progression tant que le parcours n'est pas connu.
 *
 * Calé sur le parcours le plus long : avec un dénominateur plus petit, la
 * progression pourrait décroître au moment où le vrai parcours est choisi.
 */
const JALONS_MAX = 1 + Math.max(...Object.values(NB_QUESTIONS)) + 1;

/**
 * Lit et valide `?besoin=…`.
 *
 * Les anciennes valeurs encore en circulation (`combine`, supprimé le
 * 2026-09-13) sont redirigées plutôt qu'ignorées : un lien partagé ne doit pas
 * retomber sur l'étape 1 sans explication.
 */
const lirePrefill = (valeur: string | null): Parcours | null => {
  if (!valeur) return null;
  return PARCOURS.find((p) => p === valeur) ?? PARCOURS_OBSOLETES[valeur] ?? null;
};

const SimulateurWizard = ({
  onParcoursChange,
}: {
  /** Signale à la page quel parcours est affiché, pour adapter son intro. */
  onParcoursChange?: (parcours: Parcours | null) => void;
}) => {
  const { trackEvent } = useAnalyticsEvents();
  // Note Google affichée en preuve sociale sur l'écran de capture.
  const { data: rating } = useDisplayRating();
  const debutRef = useRef<number>(Date.now());
  const hautRef = useRef<HTMLDivElement>(null);

  // Pré-sélection par page d'origine. Lue une seule fois : changer l'URL en
  // cours de parcours ne doit pas réinitialiser les réponses déjà données.
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const prefillRef = useRef<Parcours | null>(lirePrefill(params.get("besoin")));
  const prefill = prefillRef.current;

  const [parcours, setParcours] = useState<Parcours | null>(prefill);
  const [reponsesQ, setReponsesQ] = useState<Partial<Record<IdQuestion, string>>>({});
  const [modeleBorne, setModeleBorne] = useState("");
  const [preferenceRappel, setPreferenceRappel] = useState<PreferenceRappel>("rappel");

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoErreur, setPhotoErreur] = useState<string | null>(null);

  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [erreurs, setErreurs] = useState<{ nom?: string; telephone?: string; email?: string }>({});

  // Anti-spam : champ invisible qu'aucun humain ne remplit.
  const [honeypot, setHoneypot] = useState("");

  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [phaseEnvoi, setPhaseEnvoi] = useState<"photo" | "enregistrement" | null>(null);
  const [envoiErreur, setEnvoiErreur] = useState<string | null>(null);

  /** Étapes réellement traversées, dans l'ordre. */
  const sequence: Etape[] = useMemo(() => {
    if (!parcours) return ["parcours"];
    const ecrans: Etape[] = [...SEQUENCES[parcours], "capture"];
    return prefill ? ecrans : ["parcours", ...ecrans];
  }, [parcours, prefill]);

  const [etape, setEtape] = useState<Etape>(() =>
    prefill ? premierEcran(prefill) : "parcours",
  );

  const indexEtape = sequence.indexOf(etape);
  const jalons = parcours ? sequence.length : JALONS_MAX;
  const pourcentage =
    etape === "capture"
      ? 100
      : Math.min(100, Math.round(((indexEtape + 1) / jalons) * 100));

  /** Dernière question du parcours : c'est elle qui porte le bloc photo. */
  const derniereQuestion = parcours ? SEQUENCES[parcours][SEQUENCES[parcours].length - 1] : null;

  // --- Réponses et devis ----------------------------------------------------
  const reponses: Reponses | null = useMemo(() => {
    if (!parcours) return null;
    const q = reponsesQ;
    return {
      parcours,
      fournisseur: q.fournisseur as Fournisseur | undefined,
      modeleBorne: q.fournisseur === "client" ? modeleBorne : undefined,
      distance: q.distance as Distance | undefined,
      tableau: q.tableau as EtatTableau | undefined,
      age: q.age as AgeLogement | undefined,
      usage: q.usage as Usage | undefined,
      contexteRgie: q.motif as ContexteRgie | undefined,
      nombreTableaux: q.tableaux as NombreTableaux | undefined,
      // Le dépannage ne passe pas par ici : son écran unique porte lui-même son
      // état (commune et moment), et il ne demande aucune coordonnée — d'où la
      // préférence de rappel laissée vide.
      preferenceRappel: DEMANDE_COORDONNEES[parcours] ? preferenceRappel : undefined,
    };
  }, [parcours, reponsesQ, modeleBorne, preferenceRappel]);

  /** Vrai quand toutes les questions du parcours ont une réponse. */
  const parcoursComplet = useMemo(
    () => (parcours ? SEQUENCES[parcours].every((id) => !!reponsesQ[id]) : false),
    [parcours, reponsesQ],
  );

  const devis = useMemo(
    () => (reponses && parcoursComplet ? calculerDevis(reponses) : null),
    [reponses, parcoursComplet],
  );

  // --- Analytics ------------------------------------------------------------
  /**
   * Un événement par écran atteint, pour repérer où le parcours décroche. Les
   * noms `simu_step_N` sont conservés depuis la v1 : les renommer casserait
   * l'historique GA4. Le paramètre `parcours` distingue les trois tunnels.
   */
  const evenementPour = (cible: Etape, p: Parcours | null): string => {
    if (cible === "capture") return "simu_capture_vu";
    if (cible === "resultat") return "simu_resultat_vu";
    // La position est recalculée depuis le parcours passé en argument, et non
    // depuis `sequence` : au clic de l'étape 1, l'état React n'a pas encore été
    // réappliqué, et `sequence` vaudrait encore ["parcours"]. Le tunnel
    // enregistrait alors deux `simu_step_1` de suite, et jamais de step 2.
    const questions = p ? SEQUENCES[p] : [];
    const decalage = prefill ? 0 : 1; // l'étape 1 occupe le premier palier
    const position = questions.indexOf(cible as IdQuestion);
    return `simu_step_${position >= 0 ? position + 1 + decalage : 1}`;
  };

  /**
   * Premier écran affiché, compté une seule fois.
   *
   * Sans pré-sélection, le palier 1 est l'étape « qu'est-ce qui vous amène ? ».
   * Avec pré-sélection, cette étape est sautée : le palier 1 est alors la
   * première question du parcours. Dans les deux cas un seul `simu_step_1`
   * part, sinon le dénominateur du tunnel serait compté deux fois sur les
   * entrées pré-sélectionnées.
   */
  useEffect(() => {
    trackEvent("simu_step_1", {
      source_section: "simulateur",
      besoin_prefill: prefill ?? "aucun",
      parcours: prefill ?? "inconnu",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onParcoursChange?.(parcours);
  }, [parcours, onParcoursChange]);

  const remonter = () => {
    hautRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /**
   * Bouton « retour » du navigateur, et surtout geste / bouton système Android.
   *
   * Chaque avancée empile une entrée d'historique sur la MÊME URL, en
   * conservant l'état posé par react-router (`idx`, `key`) pour ne pas le
   * désorienter. Un retour arrière depuis l'étape 3 ramène donc à l'étape 2 au
   * lieu de quitter le simulateur — et le pas de trop, lui, sort bien du site
   * comme attendu, puisque l'entrée d'origine ne porte pas de `simuEtape`.
   */
  const empilerEtape = (suivante: Etape) => {
    try {
      const etatCourant = (window.history.state ?? {}) as Record<string, unknown>;
      window.history.pushState({ ...etatCourant, simuEtape: suivante }, "");
    } catch {
      /* historique indisponible : le parcours reste utilisable sans */
    }
  };

  /**
   * Un écran n'est affichable que si les réponses qu'il suppose existent.
   *
   * Le garde-fou vaut pour un retour d'historique après REMONTAGE du composant :
   * le visiteur ouvre la politique de confidentialité depuis l'écran de
   * capture, revient en arrière, et l'entrée d'historique porte toujours
   * `simuEtape: "capture"` — alors que l'état React, lui, est reparti de zéro.
   * Restaurer l'écran tel quel donnerait un formulaire mort : bouton sans
   * effet, aucun devis derrière.
   */
  const etatRef = useRef({ parcours, reponsesQ });
  etatRef.current = { parcours, reponsesQ };

  const peutAfficher = (e: Etape): boolean => {
    const s = etatRef.current;
    if (e === "parcours") return true;
    if (!s.parcours) return false;
    const questions = SEQUENCES[s.parcours];
    if (e === "capture" || e === "resultat") {
      return questions.every((id) => !!s.reponsesQ[id]);
    }
    const position = questions.indexOf(e as IdQuestion);
    if (position < 0) return false;
    // Toutes les questions qui précèdent doivent avoir été répondues.
    return questions.slice(0, position).every((id) => !!s.reponsesQ[id]);
  };

  useEffect(() => {
    const auRetour = (ev: PopStateEvent) => {
      const cible = (ev.state as { simuEtape?: Etape } | null)?.simuEtape;
      const repli: Etape = prefillRef.current
        ? premierEcran(prefillRef.current)
        : "parcours";
      setEtape(cible && peutAfficher(cible) ? cible : repli);
      remonter();
    };
    window.addEventListener("popstate", auRetour);
    return () => window.removeEventListener("popstate", auRetour);
  }, []);

  /**
   * `parcoursForce` sert au clic de l'étape 1 : `setParcours` n'a pas encore
   * pris effet dans ce rendu, et l'événement partirait sans parcours.
   */
  const aller = (suivante: Etape, parcoursForce?: Parcours) => {
    const p = parcoursForce ?? parcours;
    setEtape(suivante);
    empilerEtape(suivante);
    remonter();
    trackEvent(evenementPour(suivante, p), {
      source_section: "simulateur",
      parcours: p ?? "inconnu",
    });
  };

  /**
   * Clavier virtuel.
   *
   * Sur mobile, le clavier recouvre le bas de l'écran : le champ actif comme le
   * bouton d'envoi peuvent disparaître dessous. On ramène donc le champ au
   * centre de la zone réellement visible, ce qui laisse le bouton juste en
   * dessous à l'écran. Le déclencheur fiable est le redimensionnement du
   * `visualViewport` — c'est lui, et non `resize`, qui signale l'ouverture du
   * clavier sur iOS comme sur Android.
   */
  const formulaireRef = useRef<HTMLFormElement>(null);

  const recentrerChampActif = () => {
    const actif = document.activeElement as HTMLElement | null;
    if (!actif || !formulaireRef.current?.contains(actif)) return;
    actif.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    if (etape !== "capture") return;
    const vv = window.visualViewport;
    if (!vv) return;
    // Léger différé : le viewport se stabilise après l'animation du clavier.
    const auRedimensionnement = () => window.setTimeout(recentrerChampActif, 80);
    vv.addEventListener("resize", auRedimensionnement);
    return () => vv.removeEventListener("resize", auRedimensionnement);
  }, [etape]);

  /**
   * Le `resize` du visualViewport ne se déclenche pas quand on passe d'un champ
   * à l'autre, clavier déjà ouvert : la prise de focus doit recentrer elle
   * aussi. Le délai laisse le clavier finir de s'ouvrir au premier focus.
   */
  const auFocusChamp = () => window.setTimeout(recentrerChampActif, 250);

  /**
   * Revient à l'écran précédent.
   *
   * Passe par l'historique quand l'écran courant y a été empilé : sans cela, le
   * bouton « Retour » de l'écran et celui du navigateur se désynchronisent, et
   * chaque retour empilerait une entrée de plus. Un retour ne réémet aucun
   * événement GA4 — il gonflerait artificiellement le tunnel.
   */
  const revenirA = (precedente: Etape) => {
    const etat = window.history.state as { simuEtape?: Etape } | null;
    if (etat?.simuEtape === etape) {
      window.history.back();
      return;
    }
    setEtape(precedente);
    remonter();
  };

  const retour = () => {
    const precedente = sequence[indexEtape - 1];
    if (precedente) revenirA(precedente);
  };

  /** Pas de bouton « Retour » sur le premier écran du parcours. */
  const retourOuPas = indexEtape > 0 ? retour : undefined;

  // --- Réponse à une question ----------------------------------------------
  const repondre = (id: IdQuestion, valeur: string) => {
    setReponsesQ((prec) => ({ ...prec, [id]: valeur }));

    // Une réponse qui ouvre un champ texte n'avance pas toute seule : il faut
    // laisser le temps de taper.
    if (QUESTIONS[id].champLibreSi === valeur) return;

    // Dernière question : l'écran porte le bloc photo et son bouton
    // « Continuer », on n'avance donc pas au clic sur la réponse.
    if (id === derniereQuestion) return;

    const suivante = sequence[sequence.indexOf(id) + 1];
    if (suivante) aller(suivante);
  };

  // --- Photo (dernière question des parcours avec capture) ------------------
  const choisirPhoto = (file: File | null) => {
    setPhotoErreur(null);
    if (!file) {
      setPhoto(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setPhotoErreur("Format non accepté : choisissez une image.");
      return;
    }
    if (file.size > UPLOAD.maxMo * 1024 * 1024) {
      setPhotoErreur(`Image trop lourde (max ${UPLOAD.maxMo} Mo).`);
      return;
    }
    setPhoto(file);
  };

  const blocPhotoEtSuite = (pret: boolean) => (
    <>
      <div className="mt-8 rounded-2xl border border-dashed border-border p-5">
        <p className="text-sm text-foreground font-medium mb-1">
          En option : une photo de votre tableau électrique (le coffret à
          fusibles) nous aide à préparer votre devis
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Une image, {UPLOAD.maxMo} Mo maximum. Elle nous est transmise de façon
          privée et n'est jamais publiée.
        </p>

        {photo ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
            <span className="truncate text-sm text-foreground">{photo.name}</span>
            <button
              type="button"
              onClick={() => choisirPhoto(null)}
              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Retirer la photo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/60 hover:text-primary">
            <ImagePlus className="h-4 w-4" />
            Ajouter une photo
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(ev) => choisirPhoto(ev.target.files?.[0] ?? null)}
            />
          </label>
        )}

        {photoErreur && <p className="mt-2 text-sm text-destructive">{photoErreur}</p>}
      </div>

      <Button
        variant="copper"
        size="lg"
        className="mt-8 w-full"
        disabled={!pret}
        onClick={() => aller("capture")}
      >
        Continuer
      </Button>
    </>
  );

  // --- Écran de capture -----------------------------------------------------
  const valider = () => {
    const e: typeof erreurs = {};
    if (nom.trim().length < 2) e.nom = "Indiquez votre nom.";
    // Normalisation AVANT validation : espaces, points, tirets, parenthèses et
    // préfixe pays ne doivent jamais faire rejeter un numéro belge valide.
    const telNettoye = nettoyerGsm(telephone);
    if (!REGEX_GSM_BELGE.test(telNettoye)) {
      e.telephone = "Numéro de GSM belge attendu (ex. 0470 12 34 56).";
    }
    // Email obligatoire depuis 2026-08-16 : c'est lui qui porte l'estimation
    // détaillée envoyée juste après. Même exigence côté policy RLS Supabase.
    const emailNettoye = email.trim();
    if (!emailNettoye) {
      e.email = "Indiquez votre email pour recevoir votre estimation.";
    } else if (!REGEX_EMAIL.test(emailNettoye)) {
      e.email = "Adresse email invalide.";
    }
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const envoyer = async () => {
    // Double soumission : le bouton est déjà désactivé, cette garde couvre les
    // chemins qui ne passent pas par lui (validation implicite au clavier).
    if (envoiEnCours) return;
    setEnvoiErreur(null);

    // Bot : on affiche le résultat sans rien écrire ni envoyer. Rejet silencieux.
    if (honeypot.trim() !== "") {
      aller("resultat");
      return;
    }

    if (!valider() || !devis || !reponses) return;

    const dureeMs = Date.now() - debutRef.current;

    // Une seule soumission par session : on n'écrit pas deux fois, mais on
    // n'empêche pas le visiteur de revoir son devis.
    let dejaEnvoye = false;
    try {
      dejaEnvoye = sessionStorage.getItem(CLE_SESSION_ENVOI) === "1";
    } catch {
      /* sessionStorage indisponible : on continue */
    }

    if (dejaEnvoye) {
      aller("resultat");
      return;
    }

    setEnvoiEnCours(true);
    setPhaseEnvoi(photo ? "photo" : "enregistrement");
    const resultat = await envoyerSimulation({
      reponses,
      devis,
      coordonnees: { nom, telephone, email },
      photo,
      dureeMs,
      suspect: dureeMs < DELAI_SUSPECT_MS,
      onProgres: setPhaseEnvoi,
    });
    setEnvoiEnCours(false);
    setPhaseEnvoi(null);

    if (!resultat.dbOk && !resultat.emailOk) {
      setEnvoiErreur(
        "Votre demande n'a pas pu être transmise. Réessayez, ou appelez-nous au 0485 75 52 27.",
      );
      return;
    }

    try {
      sessionStorage.setItem(CLE_SESSION_ENVOI, "1");
    } catch {
      /* sans importance */
    }

    trackEvent("form_submit", { source_section: "simulateur" });
    trackEvent("simu_lead_envoye", {
      source_section: "simulateur",
      parcours: reponses.parcours,
      complexe: devis.complexe,
      preference_rappel: reponses.preferenceRappel ?? "non_precise",
    });
    if (devis.complexe) {
      trackEvent("simu_cas_complexe", { source_section: "simulateur" });
    }
    aller("resultat");
  };

  const prenom = nom.trim().split(/\s+/)[0] ?? "";

  // Aperçu flouté affiché derrière le formulaire de capture.
  const apercuFloute =
    devis && !devis.complexe && devis.total
      ? formatFourchette(devis.total)
      : "Visite sur place";

  // --- Rendu générique d'une question --------------------------------------
  const ecranQuestion = (id: IdQuestion) => {
    const q = QUESTIONS[id];
    const valeur = reponsesQ[id];
    const champLibreOuvert = !!q.champLibreSi && valeur === q.champLibreSi;
    const derniere = id === derniereQuestion;

    return (
      <StepShell key={id} titre={q.titre} sousTitre={q.sousTitre} onRetour={retourOuPas}>
        <div className="space-y-3">
          {q.options.map((c, i) => (
            <ChoiceCard
              key={c.value}
              icone={c.icone}
              index={i}
              label={c.label}
              description={c.description}
              selectionne={valeur === c.value}
              onClick={() => repondre(id, c.value)}
            />
          ))}
        </div>

        {/* Précision affichée quelle que soit la réponse (les autres marques
            posées, sur la question de fourniture de la borne). */}
        {q.note && (
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{q.note}</p>
        )}

        {/* Champ texte libre — aujourd'hui : la marque et le modèle de la borne
            que le client fournit lui-même. */}
        {champLibreOuvert && (
          <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
            <Label htmlFor="simu-modele">{CHAMP_MODELE_BORNE.label}</Label>
            <Input
              id="simu-modele"
              value={modeleBorne}
              onChange={(ev) => setModeleBorne(ev.target.value)}
              onFocus={auFocusChamp}
              maxLength={CHAMP_MODELE_BORNE.maxLength}
              placeholder={CHAMP_MODELE_BORNE.placeholder}
              className="mt-1.5"
            />
            <div className="mt-4 space-y-2">
              {CHAMP_MODELE_BORNE.mentions.map((m) => (
                <p key={m} className="text-xs leading-relaxed text-muted-foreground">
                  {m}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Dernière question d'un parcours avec capture : photo + Continuer.
            Une réponse ouvrant un champ texte a aussi besoin d'un bouton, sinon
            rien ne fait avancer l'écran. */}
        {derniere && parcours && DEMANDE_COORDONNEES[parcours] ? (
          blocPhotoEtSuite(!!valeur)
        ) : champLibreOuvert ? (
          <Button
            variant="copper"
            size="lg"
            className="mt-8 w-full"
            onClick={() => {
              const suivante = sequence[sequence.indexOf(id) + 1];
              if (suivante) aller(suivante);
            }}
          >
            Continuer
          </Button>
        ) : null}
      </StepShell>
    );
  };

  const questionCourante = parcours && SEQUENCES[parcours].includes(etape as IdQuestion)
    ? (etape as IdQuestion)
    : null;

  return (
    <div ref={hautRef} className="mx-auto w-full max-w-2xl scroll-mt-28">
      {/* Pas sur le résultat : il n'y a plus de progression à montrer. */}
      {etape !== "resultat" && (
        <ProgressBar pourcentage={pourcentage} />
      )}

      <AnimatePresence mode="wait">
        {/* --- Étape 1 : le parcours -------------------------------------- */}
        {etape === "parcours" && (
          <StepShell
            key="parcours"
            titre="Qu'est-ce qui vous amène ?"
            sousTitre="Choisissez ce qui correspond le mieux. Vous pourrez préciser après."
          >
            <div className="space-y-3">
              {CHOIX_PARCOURS.map((c, i) => (
                <ChoiceCard
                  key={c.value}
                  icone={c.icone}
                  index={i}
                  label={c.label}
                  description={c.description}
                  selectionne={parcours === c.value}
                  onClick={() => {
                    // Le dépannage ne passe plus par le simulateur : la grille
                    // est lisible sans clic sur la page dépannage.
                    if (c.value === "depannage") {
                      trackEvent("simu_depannage_vers_page", {
                        source_section: "simulateur_etape1",
                      });
                      navigate(PAGE_DEPANNAGE);
                      return;
                    }
                    setParcours(c.value);
                    // Repartir à zéro : changer d'avis à l'étape 1 ne doit pas
                    // traîner les réponses d'un autre parcours.
                    setReponsesQ({});
                    aller(premierEcran(c.value), c.value);
                  }}
                />
              ))}
            </div>
          </StepShell>
        )}

        {/* --- Les questions du parcours ---------------------------------- */}
        {questionCourante && ecranQuestion(questionCourante)}

        {/* --- Écran de capture ------------------------------------------- */}
        {etape === "capture" && (
          <StepShell
            key="capture"
            titre="Votre estimation pour le Brabant wallon est prête."
            sousTitre="Laissez-nous de quoi vous rappeler et elle s'affiche aussitôt."
            onRetour={retourOuPas}
          >
            <div className="grid gap-6 md:grid-cols-[minmax(0,15rem)_1fr] md:gap-8 md:items-start">
            {/* Réassurance : en haut sur mobile, colonne de gauche sur desktop.
                Note Google réelle (valeur de secours 5,0/32 tant que Supabase
                n'a pas répondu). Aucune phrase défensive ici (décision
                d'Adrian du 2026-10-26). */}
            <aside className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <LogoIcon className="h-7 w-7 text-primary shrink-0" />
                <span className="font-display text-sm font-bold leading-tight text-foreground">
                  Le Cuivre
                  <span className="block text-primary">Électrique</span>
                </span>
              </div>

              {/* La note n'est affichée QUE lorsque la source a répondu. La
                  valeur de secours reste un filet (elle évite un bloc vide
                  ailleurs sur le site), mais sur cet écran — celui où le
                  visiteur décide de laisser ses coordonnées — un chiffre non
                  vérifié serait un argument commercial non prouvé. */}
              {!rating.isFallback && (
                <div className="space-y-1.5">
                  <span className="flex" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </span>
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{rating.ratingValueFormatted}/5</span> sur
                    Google · {rating.reviewCount} avis
                  </p>
                </div>
              )}

            </aside>

            <div>
            {/* Aperçu flouté : on montre qu'il y a bien un résultat derrière. */}
            <div
              aria-hidden="true"
              className="relative mb-6 overflow-hidden rounded-2xl border border-border/60 bg-card px-6 py-8 text-center"
            >
              <p className="select-none blur-md font-display text-3xl md:text-4xl font-black text-gradient-copper">
                {apercuFloute}
              </p>
              <span className="absolute inset-0 flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary/70" />
              </span>
            </div>

            <form
              ref={formulaireRef}
              className="space-y-4"
              // La validation native du navigateur bloquerait la soumission sur
              // un `type="email"` mal formé et afficherait sa propre bulle, dans
              // la langue du navigateur et hors de notre mise en page — nos
              // messages en français ne s'afficheraient jamais. On valide
              // intégralement nous-mêmes (voir `valider`).
              noValidate
              onSubmit={(ev) => {
                ev.preventDefault();
                void envoyer();
              }}
            >
              <div>
                <Label htmlFor="simu-nom">Nom et prénom</Label>
                <Input
                  id="simu-nom"
                  value={nom}
                  onChange={(ev) => setNom(ev.target.value)}
                  onFocus={auFocusChamp}
                  autoComplete="name"
                  className="mt-1.5"
                  aria-invalid={!!erreurs.nom}
                />
                {erreurs.nom && <p className="mt-1 text-sm text-destructive">{erreurs.nom}</p>}
              </div>

              <div>
                <Label htmlFor="simu-tel">Téléphone GSM</Label>
                {/* Préfixe belge affiché en dur : le visiteur voit tout de suite
                    qu'on attend un numéro belge. La saisie est délibérément
                    tolérante — « 0470 12 34 56 », « +32 470/12.34.56 » ou
                    « 470-123-456 » sont tous acceptés : saisirGsm retire à la
                    volée ce qui n'est pas un numéro et le préfixe pays déjà
                    affiché, nettoyerGsm normalise avant validation, et
                    normaliserGsm stocke une forme unique. */}
                <div
                  className={`mt-1.5 flex items-stretch overflow-hidden rounded-md border bg-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background ${
                    erreurs.telephone ? "border-destructive" : "border-input"
                  }`}
                >
                  {/* Préfixe en texte simple : un drapeau emoji dépend de la
                      police du système et se dégrade en « BE » sur les postes
                      qui n'en ont pas. */}
                  <span
                    aria-hidden="true"
                    className="flex select-none items-center border-r border-input bg-muted/60 px-3.5 text-sm font-semibold text-foreground"
                  >
                    +32
                  </span>
                  <input
                    id="simu-tel"
                    type="tel"
                    inputMode="tel"
                    placeholder="470 12 34 56"
                    value={telephone}
                    onChange={(ev) => setTelephone(saisirGsm(ev.target.value))}
                    onFocus={auFocusChamp}
                    autoComplete="tel"
                    aria-invalid={!!erreurs.telephone}
                    aria-describedby="simu-tel-aide"
                    className="h-10 w-full bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground md:text-sm"
                  />
                </div>
                {erreurs.telephone ? (
                  <p className="mt-1 text-sm text-destructive">{erreurs.telephone}</p>
                ) : (
                  <p id="simu-tel-aide" className="mt-1 text-xs text-muted-foreground">
                    Pour vous rappeler et vous envoyer votre devis.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="simu-email">
                  Votre email (pour recevoir votre estimation détaillée)
                </Label>
                <Input
                  id="simu-email"
                  type="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  onFocus={auFocusChamp}
                  autoComplete="email"
                  className="mt-1.5"
                  aria-invalid={!!erreurs.email}
                />
                {erreurs.email && (
                  <p className="mt-1 text-sm text-destructive">{erreurs.email}</p>
                )}
              </div>

              {/* Préférence de rappel. Deux boutons plutôt qu'une case à
                  cocher : « je veux juste voir les prix » doit être un choix
                  assumé et visible, pas une option qu'on décoche. Il ne change
                  rien à ce qui s'affiche ensuite, il dit à Adrian qui rappeler
                  en premier. */}
              <fieldset className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <legend className="px-1 text-sm font-medium text-foreground">
                  Vous préférez…
                </legend>
                <div className="mt-2 space-y-2">
                  {PREFERENCES_RAPPEL.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPreferenceRappel(p.value)}
                      aria-pressed={preferenceRappel === p.value}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        preferenceRappel === p.value
                          ? "border-primary bg-primary/[0.07] text-foreground"
                          : "border-border/70 bg-card text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {/* Pastille de sélection en CSS, sans emoji. */}
                      <span
                        aria-hidden="true"
                        className={`h-3 w-3 shrink-0 rounded-full border-2 transition-colors ${
                          preferenceRappel === p.value
                            ? "border-primary bg-primary"
                            : "border-border"
                        }`}
                      />
                      {p.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Honeypot — hors écran, hors tabulation, masqué aux lecteurs d'écran */}
              <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
                <label htmlFor="simu-societe-site">Ne pas remplir</label>
                <input
                  id="simu-societe-site"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(ev) => setHoneypot(ev.target.value)}
                />
              </div>

              {envoiErreur && (
                <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {envoiErreur}
                </p>
              )}

              <Button
                type="submit"
                variant="copper"
                size="lg"
                className="w-full"
                disabled={envoiEnCours}
              >
                {envoiEnCours ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {phaseEnvoi === "photo"
                      ? "Envoi de votre photo…"
                      : "Envoi en cours…"}
                  </>
                ) : (
                  "Voir mon estimation gratuite"
                )}
              </Button>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {MENTIONS.rgpdCapture}{" "}
                <Link to="/confidentialite" className="underline hover:text-primary">
                  Politique de confidentialité
                </Link>
              </p>
            </form>
            </div>
            </div>
          </StepShell>
        )}

        {/* --- Le mini-devis ---------------------------------------------- */}
        {etape === "resultat" && devis && reponses && (
          <motion.div key="resultat">
            {devis.complexe ? (
              <EcranComplexe reponses={reponses} devis={devis} prenom={prenom} />
            ) : (
              <EcranDevis reponses={reponses} devis={devis} prenom={prenom} />
            )}

            {photo && (
              <div className="mt-6">
                <MentionBox>
                  Votre photo du tableau nous a bien été transmise, elle sera consultée
                  avant le devis.
                </MentionBox>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SimulateurWizard;
