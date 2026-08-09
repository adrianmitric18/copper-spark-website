/**
 * Simulateur de prix — parcours complet.
 *
 * Une question par écran, avancement automatique au clic sur les trois
 * premières (le parcours doit tenir sous 45 secondes), puis un écran de
 * capture avant le résultat.
 *
 * Le calcul est intégralement local (voir lib/simulateur/calcul.ts) : le
 * réseau n'est sollicité qu'au moment de l'envoi, une fois les coordonnées
 * saisies.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Lock, ImagePlus, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";
import { useDisplayRating } from "@/hooks/useDisplayRating";
import LogoIcon from "@/components/LogoIcon";
import {
  BESOINS,
  MENTIONS,
  CLE_SESSION_ENVOI,
  DELAI_SUSPECT_MS,
  DISTANCES,
  INSTALLATIONS,
  REGEX_GSM_BELGE,
  UPLOAD,
  USAGES,
  type Besoin,
  type Distance,
  type Installation,
  type Usage,
} from "@/lib/simulateur/config";
import { calculerEstimation, formatFourchette } from "@/lib/simulateur/calcul";
import { envoyerSimulation } from "@/lib/simulateur/submit";
import { ChoiceCard, MentionBox, ProgressBar, StepShell } from "./SimulateurUI";
import { EcranComplexe, EcranResultat } from "./SimulateurResultat";

type Etape = "besoin" | "distance" | "installation" | "usage" | "capture" | "resultat";

const besoinInclutBorne = (b: Besoin | null) => b === "borne" || b === "combine";

const SimulateurWizard = () => {
  const { trackEvent } = useAnalyticsEvents();
  // Note Google affichée en preuve sociale sur l'écran de capture.
  const { data: rating } = useDisplayRating();
  const debutRef = useRef<number>(Date.now());
  const hautRef = useRef<HTMLDivElement>(null);

  const [etape, setEtape] = useState<Etape>("besoin");
  const [besoin, setBesoin] = useState<Besoin | null>(null);
  const [distance, setDistance] = useState<Distance | null>(null);
  const [installation, setInstallation] = useState<Installation | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoErreur, setPhotoErreur] = useState<string | null>(null);

  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [erreurs, setErreurs] = useState<{ nom?: string; telephone?: string; email?: string }>({});

  // Anti-spam : champ invisible qu'aucun humain ne remplit.
  const [honeypot, setHoneypot] = useState("");

  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [envoiErreur, setEnvoiErreur] = useState<string | null>(null);

  // Étapes réellement traversées : la distance ne concerne que les bornes.
  const sequence: Etape[] = useMemo(
    () =>
      besoinInclutBorne(besoin)
        ? ["besoin", "distance", "installation", "usage", "capture"]
        : ["besoin", "installation", "usage", "capture"],
    [besoin],
  );

  const indexEtape = sequence.indexOf(etape);

  // Progression sur un dénominateur FIXE de 4 jalons : 25 / 50 / 75 / 100 %.
  //
  // Volontairement indépendant de la longueur réelle du parcours. Un
  // dénominateur dynamique afficherait 33 % dès le premier écran (tant que le
  // besoin n'est pas choisi, on ignore si la question « distance » sera posée),
  // puis sauterait en arrière. Avec 4 jalons fixes, les deux parcours affichent
  // la même progression rassurante — le parcours borne atteint simplement 100 %
  // à la question « usage », et l'écran de capture reste à 100 %.
  const JALONS = 4;
  const pourcentage =
    etape === "capture"
      ? 100
      : Math.min(100, Math.round(((indexEtape + 1) / JALONS) * 100));
  const estimation = useMemo(() => {
    if (!besoin || !installation || !usage) return null;
    return calculerEstimation({
      besoin,
      distance: besoinInclutBorne(besoin) ? (distance ?? undefined) : undefined,
      installation,
      usage,
    });
  }, [besoin, distance, installation, usage]);

  // Premier écran : l'entrée dans le parcours doit être comptée elle aussi,
  // sinon le taux de complétion n'a pas de dénominateur.
  useEffect(() => {
    trackEvent("simu_step_1", { source_section: "simulateur" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remonter = () => {
    hautRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Un événement GA4 par écran atteint, pour repérer où le parcours décroche.
  // useAnalyticsEvents applique déjà le consent mode et le filtrage des bots.
  const EVENEMENT_PAR_ETAPE: Record<Etape, string> = {
    besoin: "simu_step_1",
    distance: "simu_step_2",
    installation: "simu_step_3",
    usage: "simu_step_4",
    capture: "simu_capture_vu",
    resultat: "simu_resultat_vu",
  };

  const aller = (suivante: Etape) => {
    setEtape(suivante);
    remonter();
    trackEvent(EVENEMENT_PAR_ETAPE[suivante], { source_section: "simulateur" });
  };

  const retour = () => {
    const precedente = sequence[indexEtape - 1];
    if (precedente) aller(precedente);
  };

  // --- Étape 4 : photo ------------------------------------------------------
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

  // --- Écran de capture -----------------------------------------------------
  const valider = () => {
    const e: typeof erreurs = {};
    if (nom.trim().length < 2) e.nom = "Indiquez votre nom.";
    const telNettoye = telephone.replace(/[\s.\-/()]/g, "");
    if (!REGEX_GSM_BELGE.test(telNettoye)) {
      e.telephone = "Numéro de GSM belge attendu (ex. 0470 12 34 56).";
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      e.email = "Adresse email invalide.";
    }
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const envoyer = async () => {
    setEnvoiErreur(null);

    // Bot : on affiche le résultat sans rien écrire ni envoyer. Rejet silencieux.
    if (honeypot.trim() !== "") {
      aller("resultat");
      return;
    }

    if (!valider() || !estimation || !besoin || !installation || !usage) return;

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
    const resultat = await envoyerSimulation({
      reponses: {
        besoin,
        distance: besoinInclutBorne(besoin) ? (distance ?? undefined) : undefined,
        installation,
        usage,
      },
      estimation,
      coordonnees: { nom, telephone, email },
      photo,
      dureeMs,
      suspect: dureeMs < DELAI_SUSPECT_MS,
    });
    setEnvoiEnCours(false);

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
      besoin,
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
      {etape !== "resultat" && <ProgressBar pourcentage={pourcentage} />}

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
                    setBesoin(c.value);
                    if (!besoinInclutBorne(c.value)) setDistance(null);
                    aller(besoinInclutBorne(c.value) ? "distance" : "installation");
                  }}
                />
              ))}
            </div>
          </StepShell>
        )}

        {/* --- Étape 2 : distance ----------------------------------------- */}
        {etape === "distance" && (
          <StepShell
            key="distance"
            titre="Où sera placée la borne par rapport à votre tableau électrique ?"
            sousTitre="Le tableau, c'est le coffret avec les fusibles ou les disjoncteurs, souvent au garage, à la cave ou dans la buanderie."
            onRetour={retour}
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

        {/* --- Étape 3 : installation ------------------------------------- */}
        {etape === "installation" && (
          <StepShell
            key="installation"
            titre="Votre installation électrique, elle ressemble à quoi ?"
            sousTitre="Une idée générale suffit, on vérifiera ensemble."
            onRetour={retour}
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
                    aller("usage");
                  }}
                />
              ))}
            </div>
          </StepShell>
        )}

        {/* --- Étape 4 : usage + photo ------------------------------------ */}
        {etape === "usage" && (
          <StepShell
            key="usage"
            titre={besoinInclutBorne(besoin) ? "Cette borne, c'est pour..." : "Ce projet, c'est pour..."}
            sousTitre="Cela change les avantages fiscaux auxquels vous avez droit."
            onRetour={retour}
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

            {/* Photo facultative */}
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

              {photoErreur && (
                <p className="mt-2 text-sm text-destructive">{photoErreur}</p>
              )}
            </div>

            <Button
              variant="copper"
              size="lg"
              className="mt-8 w-full"
              disabled={!usage}
              onClick={() => aller("capture")}
            >
              Continuer
            </Button>
          </StepShell>
        )}

        {/* --- Écran de capture ------------------------------------------- */}
        {etape === "capture" && (
          <StepShell
            key="capture"
            titre="Votre estimation pour le Brabant wallon est prête."
            sousTitre="Laissez-nous de quoi vous rappeler et elle s'affiche aussitôt."
            onRetour={retour}
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
              className="space-y-4"
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
                  autoComplete="name"
                  className="mt-1.5"
                  aria-invalid={!!erreurs.nom}
                />
                {erreurs.nom && <p className="mt-1 text-sm text-destructive">{erreurs.nom}</p>}
              </div>

              <div>
                <Label htmlFor="simu-tel">Téléphone GSM</Label>
                {/* Préfixe belge affiché en dur : le visiteur voit tout de suite
                    qu'on attend un numéro belge. La saisie reste tolérante —
                    « 0470… », « +32470… » ou « 470… » sont tous acceptés puis
                    normalisés à l'envoi (normaliserGsm). */}
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
                    onChange={(ev) => setTelephone(ev.target.value)}
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
                  Email <span className="text-muted-foreground font-normal">(facultatif)</span>
                </Label>
                <Input
                  id="simu-email"
                  type="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
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
                    Envoi…
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

        {/* --- Résultat ---------------------------------------------------- */}
        {etape === "resultat" && estimation && besoin && installation && usage && (
          <motion.div key="resultat">
            {estimation.complexe ? (
              <EcranComplexe
                reponses={{
                  besoin,
                  distance: besoinInclutBorne(besoin) ? (distance ?? undefined) : undefined,
                  installation,
                  usage,
                }}
                estimation={estimation}
                prenom={prenom}
              />
            ) : (
              <EcranResultat
                reponses={{
                  besoin,
                  distance: besoinInclutBorne(besoin) ? (distance ?? undefined) : undefined,
                  installation,
                  usage,
                }}
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
