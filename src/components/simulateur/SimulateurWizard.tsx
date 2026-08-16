/**
 * Simulateur de prix — parcours complet.
 *
 * Une question par écran, avancement automatique au clic sur les premières
 * (le parcours doit tenir sous 45 secondes), puis un écran de capture avant le
 * résultat.
 *
 * Trois entrées possibles, selon la page d'origine :
 *   - /simulateur                  → le besoin est demandé à l'étape 1 ;
 *   - /simulateur?besoin=borne     → parcours borne direct (étape 1 sautée) ;
 *   - /simulateur?besoin=rgie      → parcours conformité direct, sans aucune
 *                                    question de borne ;
 *   - /simulateur?besoin=depannage → sortie immédiate sur la grille tarifaire.
 *
 * Le calcul est intégralement local (voir lib/simulateur/calcul.ts) : le
 * réseau n'est sollicité qu'au moment de l'envoi, une fois les coordonnées
 * saisies.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Lock, ImagePlus, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";
import { useDisplayRating } from "@/hooks/useDisplayRating";
import LogoIcon from "@/components/LogoIcon";
import {
  BESOINS,
  CHOIX_ETAPE_1,
  CONTEXTES_RGIE,
  MENTIONS,
  CLE_SESSION_ENVOI,
  DELAI_SUSPECT_MS,
  DISTANCES,
  INSTALLATIONS,
  REGEX_EMAIL,
  REGEX_GSM_BELGE,
  UPLOAD,
  USAGES,
  USAGE_PAR_CONTEXTE_RGIE,
  nettoyerGsm,
  saisirGsm,
  type Besoin,
  type ChoixEtape1,
  type ContexteRgie,
  type Distance,
  type Installation,
  type Usage,
} from "@/lib/simulateur/config";
import {
  calculerEstimation,
  formatFourchette,
  type ReponsesSimulateur,
} from "@/lib/simulateur/calcul";
import { envoyerSimulation } from "@/lib/simulateur/submit";
import { ChoiceCard, MentionBox, ProgressBar, StepShell } from "./SimulateurUI";
import { EcranComplexe, EcranDepannage, EcranResultat } from "./SimulateurResultat";

type Etape =
  | "besoin"
  | "distance"
  | "installation"
  | "usage"
  | "contexte"
  | "capture"
  | "resultat"
  | "depannage";

const besoinInclutBorne = (b: Besoin | null) => b === "borne" || b === "combine";

/**
 * Un événement GA4 par écran atteint, pour repérer où le parcours décroche.
 * useAnalyticsEvents applique déjà le consent mode et le filtrage des bots.
 *
 * `contexte` partage le palier de `usage` : c'est la même position dans le
 * parcours (dernière question), simplement reformulée pour la conformité.
 */
const EVENEMENT_PAR_ETAPE: Record<Etape, string> = {
  besoin: "simu_step_1",
  distance: "simu_step_2",
  installation: "simu_step_3",
  usage: "simu_step_4",
  contexte: "simu_step_4",
  capture: "simu_capture_vu",
  resultat: "simu_resultat_vu",
  depannage: "simu_depannage_vu",
};

/** Lit et valide `?besoin=…`. Toute autre valeur est ignorée. */
const lirePrefill = (valeur: string | null): ChoixEtape1 | null =>
  CHOIX_ETAPE_1.find((c) => c === valeur) ?? null;

/** Premier écran affiché, selon la pré-sélection éventuelle. */
const etapeInitiale = (prefill: ChoixEtape1 | null): Etape => {
  if (prefill === "depannage") return "depannage";
  if (prefill === "rgie") return "installation";
  if (prefill) return "distance";
  return "besoin";
};

interface Props {
  /**
   * Signale à la page si l'écran affiché relève encore de la simulation ou de
   * la branche dépannage, pour que l'intro ne promette pas « 4 questions »
   * au-dessus d'une grille tarifaire.
   */
  onEcranChange?: (ecran: "simulation" | "depannage") => void;
}

const SimulateurWizard = ({ onEcranChange }: Props) => {
  const { trackEvent } = useAnalyticsEvents();
  // Note Google affichée en preuve sociale sur l'écran de capture.
  const { data: rating } = useDisplayRating();
  const debutRef = useRef<number>(Date.now());
  const hautRef = useRef<HTMLDivElement>(null);

  // Pré-sélection par page d'origine. Lue une seule fois : changer l'URL en
  // cours de parcours ne doit pas réinitialiser les réponses déjà données.
  const [params] = useSearchParams();
  const prefillRef = useRef<ChoixEtape1 | null>(lirePrefill(params.get("besoin")));
  const prefill = prefillRef.current;
  /** Vrai quand l'étape 1 est sautée (pré-sélection d'un besoin simulable). */
  const besoinPrefill = prefill !== null && prefill !== "depannage";

  const [etape, setEtape] = useState<Etape>(() => etapeInitiale(prefill));
  const [besoin, setBesoin] = useState<Besoin | null>(
    besoinPrefill ? (prefill as Besoin) : null,
  );
  const [distance, setDistance] = useState<Distance | null>(null);
  const [installation, setInstallation] = useState<Installation | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [contexteRgie, setContexteRgie] = useState<ContexteRgie | null>(null);

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

  /**
   * Étapes réellement traversées.
   *
   * Le parcours RGIE seul ne pose AUCUNE question de borne : ni la distance
   * borne / tableau, ni l'usage du véhicule. À la place de l'usage, on demande
   * le motif de la mise en conformité (vente, échéance du certificat, travaux,
   * bien professionnel).
   */
  const sequence: Etape[] = useMemo(() => {
    const questions: Etape[] =
      besoin === "rgie"
        ? ["installation", "contexte"]
        : ["distance", "installation", "usage"];
    return besoinPrefill
      ? [...questions, "capture"]
      : ["besoin", ...questions, "capture"];
  }, [besoin, besoinPrefill]);

  const indexEtape = sequence.indexOf(etape);

  /**
   * Progression.
   *
   * Le dénominateur est la longueur réelle du parcours dès que le besoin est
   * connu — ce qui est immédiat quand il est pré-sélectionné. Tant qu'il ne
   * l'est pas (écran 1 du parcours complet), on retient 4 jalons : un
   * dénominateur calculé sur la séquence provisoire afficherait 20 % puis
   * sauterait en arrière sur le parcours RGIE. Avec ce repli, la progression
   * n'est jamais décroissante, quel que soit le chemin.
   */
  const jalons = besoin ? sequence.length : 4;
  const pourcentage =
    etape === "capture"
      ? 100
      : Math.min(100, Math.round(((indexEtape + 1) / jalons) * 100));

  /** Usage effectif : déduit du contexte sur le parcours RGIE seul. */
  const usageEffectif: Usage | null =
    besoin === "rgie" ? (contexteRgie ? USAGE_PAR_CONTEXTE_RGIE[contexteRgie] : null) : usage;

  const reponses: ReponsesSimulateur | null = useMemo(() => {
    if (!besoin || !installation || !usageEffectif) return null;
    return {
      besoin,
      distance: besoinInclutBorne(besoin) ? (distance ?? undefined) : undefined,
      installation,
      usage: usageEffectif,
      contexteRgie: besoin === "rgie" ? (contexteRgie ?? undefined) : undefined,
    };
  }, [besoin, distance, installation, usageEffectif, contexteRgie]);

  const estimation = useMemo(
    () => (reponses ? calculerEstimation(reponses) : null),
    [reponses],
  );

  // Premier écran : l'entrée dans le parcours doit être comptée elle aussi,
  // sinon le taux de complétion n'a pas de dénominateur. `besoin_prefill` dit
  // depuis quelle page d'origine le visiteur arrive.
  useEffect(() => {
    const depuis = { source_section: "simulateur", besoin_prefill: prefill ?? "aucun" };
    trackEvent("simu_step_1", depuis);
    // Étape 1 sautée : l'écran réellement affiché doit être compté lui aussi,
    // sans quoi le premier palier du tunnel serait vide sur ces entrées.
    if (prefill) trackEvent(EVENEMENT_PAR_ETAPE[etapeInitiale(prefill)], depuis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onEcranChange?.(etape === "depannage" ? "depannage" : "simulation");
  }, [etape, onEcranChange]);

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
   * effet, aucune estimation derrière.
   */
  const etatRef = useRef({ besoin, distance, installation, usage, contexteRgie });
  etatRef.current = { besoin, distance, installation, usage, contexteRgie };

  const peutAfficher = (e: Etape): boolean => {
    const s = etatRef.current;
    switch (e) {
      case "besoin":
      case "depannage":
        return true;
      case "distance":
        return s.besoin !== null;
      case "installation":
        return s.besoin !== null && (s.besoin === "rgie" || s.distance !== null);
      case "usage":
      case "contexte":
        return s.installation !== null;
      case "capture":
      case "resultat":
        return (
          s.installation !== null &&
          (s.besoin === "rgie" ? s.contexteRgie !== null : s.usage !== null)
        );
      default:
        return false;
    }
  };

  useEffect(() => {
    const auRetour = (ev: PopStateEvent) => {
      const cible = (ev.state as { simuEtape?: Etape } | null)?.simuEtape;
      // Pas d'étape dans l'état (entrée d'origine de la page), ou écran devenu
      // inatteignable : on repart du premier écran du parcours.
      setEtape(cible && peutAfficher(cible) ? cible : etapeInitiale(prefillRef.current));
      remonter();
    };
    window.addEventListener("popstate", auRetour);
    return () => window.removeEventListener("popstate", auRetour);
  }, []);

  const aller = (suivante: Etape) => {
    setEtape(suivante);
    empilerEtape(suivante);
    remonter();
    trackEvent(EVENEMENT_PAR_ETAPE[suivante], { source_section: "simulateur" });
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

  /** Écran qui suit l'étape 1, selon le besoin choisi. */
  const premiereQuestion = (choix: Besoin): Etape =>
    choix === "rgie" ? "installation" : "distance";

  // --- Photo (dernière question) -------------------------------------------
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

  /**
   * Bloc photo + bouton « Continuer », commun à la dernière question des deux
   * parcours (usage pour la borne, contexte pour la conformité).
   */
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

    if (!valider() || !estimation || !reponses) return;

    const dureeMs = Date.now() - debutRef.current;

    // Une seule soumission par session : on n'écrit pas deux fois, mais on
    // n'empêche pas le visiteur de revoir son estimation.
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
      estimation,
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
      besoin: reponses.besoin,
      complexe: estimation.complexe,
    });
    if (estimation.complexe) {
      trackEvent("simu_cas_complexe", { source_section: "simulateur" });
    }
    aller("resultat");
  };

  const prenom = nom.trim().split(/\s+/)[0] ?? "";

  // Aperçu flouté affiché derrière le formulaire de capture.
  const apercuFloute =
    estimation && !estimation.complexe && estimation.total
      ? formatFourchette(estimation.total)
      : "Métré technique gratuit";

  return (
    <div ref={hautRef} className="mx-auto w-full max-w-2xl scroll-mt-28">
      {etape !== "resultat" && etape !== "depannage" && (
        <ProgressBar pourcentage={pourcentage} />
      )}

      <AnimatePresence mode="wait">
        {/* --- Étape 1 : besoin ------------------------------------------- */}
        {etape === "besoin" && (
          <StepShell
            key="besoin"
            titre="Qu'est-ce qui vous amène ?"
            sousTitre="Choisissez ce qui correspond le mieux. Vous pourrez préciser après."
          >
            <div className="space-y-3">
              {BESOINS.map((c, i) => (
                <ChoiceCard
                  key={c.value}
                  icone={c.icone}
                  index={i}
                  label={c.label}
                  description={c.description}
                  selectionne={besoin === c.value}
                  onClick={() => {
                    // Le dépannage ne lance aucune simulation : il n'y a rien à
                    // chiffrer à l'avance sur une panne en cours.
                    if (c.value === "depannage") {
                      setBesoin(null);
                      aller("depannage");
                      return;
                    }
                    setBesoin(c.value);
                    if (!besoinInclutBorne(c.value)) setDistance(null);
                    if (c.value !== "rgie") setContexteRgie(null);
                    aller(premiereQuestion(c.value));
                  }}
                />
              ))}
            </div>
          </StepShell>
        )}

        {/* --- Distance borne / tableau (parcours borne uniquement) -------- */}
        {etape === "distance" && (
          <StepShell
            key="distance"
            titre="Où sera placée la borne par rapport à votre tableau électrique ?"
            sousTitre="Le tableau, c'est le coffret avec les fusibles ou les disjoncteurs, souvent au garage, à la cave ou dans la buanderie."
            onRetour={retourOuPas}
          >
            <div className="space-y-3">
              {DISTANCES.map((c, i) => (
                <ChoiceCard
                  key={c.value}
                  icone={c.icone}
                  index={i}
                  label={c.label}
                  description={c.description}
                  selectionne={distance === c.value}
                  onClick={() => {
                    setDistance(c.value);
                    aller("installation");
                  }}
                />
              ))}
            </div>
          </StepShell>
        )}

        {/* --- État de l'installation (tous les parcours) ------------------ */}
        {etape === "installation" && (
          <StepShell
            key="installation"
            titre="Votre installation électrique, elle ressemble à quoi ?"
            sousTitre="Une idée générale suffit, on vérifiera ensemble."
            onRetour={retourOuPas}
          >
            <div className="space-y-3">
              {INSTALLATIONS.map((c, i) => (
                <ChoiceCard
                  key={c.value}
                  icone={c.icone}
                  index={i}
                  label={c.label}
                  description={c.description}
                  selectionne={installation === c.value}
                  onClick={() => {
                    setInstallation(c.value);
                    aller(besoin === "rgie" ? "contexte" : "usage");
                  }}
                />
              ))}
            </div>
          </StepShell>
        )}

        {/* --- Usage du véhicule (parcours borne et combiné) --------------- */}
        {etape === "usage" && (
          <StepShell
            key="usage"
            titre={besoinInclutBorne(besoin) ? "Cette borne, c'est pour..." : "Ce projet, c'est pour..."}
            sousTitre="Cela change les avantages fiscaux auxquels vous avez droit."
            onRetour={retourOuPas}
          >
            <div className="space-y-3">
              {USAGES.map((c, i) => (
                <ChoiceCard
                  key={c.value}
                  icone={c.icone}
                  index={i}
                  label={c.label}
                  description={c.description}
                  selectionne={usage === c.value}
                  onClick={() => setUsage(c.value)}
                />
              ))}
            </div>

            {blocPhotoEtSuite(!!usage)}
          </StepShell>
        )}

        {/* --- Motif de la conformité (parcours RGIE seul) ----------------- */}
        {etape === "contexte" && (
          <StepShell
            key="contexte"
            titre="Cette mise en conformité, c'est pour quoi ?"
            sousTitre="Cela nous dit surtout s'il y a une échéance à tenir."
            onRetour={retourOuPas}
          >
            <div className="space-y-3">
              {CONTEXTES_RGIE.map((c, i) => (
                <ChoiceCard
                  key={c.value}
                  icone={c.icone}
                  index={i}
                  label={c.label}
                  description={c.description}
                  selectionne={contexteRgie === c.value}
                  onClick={() => setContexteRgie(c.value)}
                />
              ))}
            </div>

            {blocPhotoEtSuite(!!contexteRgie)}
          </StepShell>
        )}

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
                n'a pas répondu) et rappel qu'il y a un artisan du coin derrière
                ce formulaire, pas un comparateur. */}
            <aside className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <LogoIcon className="h-7 w-7 text-primary shrink-0" />
                <span className="font-display text-sm font-bold leading-tight text-foreground">
                  Le Cuivre
                  <span className="block text-primary">Électrique</span>
                </span>
              </div>

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

              <p className="text-sm text-muted-foreground leading-relaxed">
                Réponse rapide par un électricien basé à Court-Saint-Étienne, pas une
                plateforme de revente de leads.
              </p>
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

        {/* --- Dépannage : grille tarifaire, pas de simulation -------------- */}
        {etape === "depannage" && (
          <motion.div key="depannage">
            {/* Retour possible seulement si l'étape 1 a bien été affichée. */}
            {!prefill && (
              <button
                type="button"
                onClick={() => revenirA("besoin")}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            )}
            <EcranDepannage />
          </motion.div>
        )}

        {/* --- Résultat ---------------------------------------------------- */}
        {etape === "resultat" && estimation && reponses && (
          <motion.div key="resultat">
            {estimation.complexe ? (
              <EcranComplexe
                reponses={reponses}
                estimation={estimation}
                prenom={prenom}
              />
            ) : (
              <EcranResultat
                reponses={reponses}
                estimation={estimation}
                prenom={prenom}
              />
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
