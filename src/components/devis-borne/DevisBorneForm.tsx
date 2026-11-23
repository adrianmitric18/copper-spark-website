import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Camera, CheckCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";
import {
  DELAI,
  ORIENTATION_ZAPTEC_PRO,
  PHOTOS,
  PHOTO_LIMITES,
  QUESTIONS,
  RESERVE,
  demanderAccord,
  orienterVersZaptecPro,
  valider,
  type Coordonnees,
  type Erreurs,
  type IdPhoto,
  type IdQuestion,
  type Reponses,
  type Textes,
} from "@/lib/devis-borne/config";
import { envoyerDevisBorne, type ResultatEnvoi } from "@/lib/devis-borne/submit";

/**
 * Formulaire « Borne : devis sans déplacement » — demander un devis de borne
 * sans appeler, avec les réponses et les photos qui permettent de chiffrer.
 *
 * Il n'a PAS de page à lui : c'est le deuxième choix de la page /contact
 * (règle d'Adrian du 2026-11-22 : un seul endroit pour les demandes). L'adresse
 * /devis-borne redirige vers /contact?demande=borne.
 *
 * Obligatoires : nom, téléphone OU e-mail, code postal. Tout le reste est
 * facultatif. Les questions et les photos sont décrites dans
 * src/lib/devis-borne/config.ts ; l'envoi dans submit.ts.
 *
 * Les schémas des photos sont des dessins provisoires, en attendant les vraies
 * photos d'exemple d'Adrian.
 */

/** En dessous de ce délai entre l'ouverture et l'envoi, la demande est notée « suspecte » (jamais bloquée). */
const DELAI_SUSPECT_MS = 8_000;

// ---------------------------------------------------------------------------
//  Schémas des cinq photos (dessins simples, sans texte)
// ---------------------------------------------------------------------------

const trait = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const SCHEMAS: Record<IdPhoto, ReactNode> = {
  compteur: (
    <>
      <rect x="20" y="8" width="40" height="48" rx="4" {...trait} />
      <rect x="27" y="16" width="26" height="10" rx="1.5" {...trait} />
      <path d="M31 21h4M38 21h4M45 21h4" {...trait} />
      <rect x="27" y="34" width="26" height="14" rx="1.5" {...trait} strokeDasharray="3 3" />
      <path d="M40 56v6" {...trait} />
    </>
  ),
  tableau_pres: (
    <>
      <rect x="12" y="8" width="56" height="48" rx="3" {...trait} />
      <path d="M12 24h56M12 40h56" {...trait} />
      <path d="M20 12v8M28 12v8M36 12v8M44 12v8M52 12v8M60 12v8M20 28v8M28 28v8M36 28v8M44 28v8M20 44v8M28 44v8" {...trait} />
    </>
  ),
  tableau_loin: (
    <>
      <path d="M4 58h72M4 6v52M76 6v52" {...trait} />
      <rect x="30" y="18" width="20" height="24" rx="2" {...trait} />
      <path d="M30 26h20M30 34h20" {...trait} />
      <path d="M40 42v16" {...trait} strokeDasharray="3 3" />
    </>
  ),
  emplacement: (
    <>
      <path d="M4 58h72M10 58V10h18v48" {...trait} />
      <rect x="14" y="22" width="10" height="14" rx="2" {...trait} />
      <path d="M24 30c8 0 8 12 16 12" {...trait} />
      <path d="M38 50l4-10h22l6 10v6H38z" {...trait} />
      <circle cx="46" cy="56" r="3" {...trait} />
      <circle cx="62" cy="56" r="3" {...trait} />
    </>
  ),
  trajet: (
    <>
      <rect x="6" y="14" width="14" height="18" rx="2" {...trait} />
      <path d="M6 22h14" {...trait} />
      <rect x="62" y="30" width="10" height="14" rx="2" {...trait} />
      <path d="M20 23h14v22h28V37" {...trait} strokeDasharray="4 3" />
      <path d="M4 58h72" {...trait} />
    </>
  ),
};

const Schema = ({ id }: { id: IdPhoto }) => (
  <svg viewBox="0 0 80 64" className="h-16 w-20 shrink-0 text-primary" aria-hidden="true" focusable="false">
    {SCHEMAS[id]}
  </svg>
);

// ---------------------------------------------------------------------------
//  Petits composants du formulaire
// ---------------------------------------------------------------------------

const champ =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

/** Une question à cocher : un seul choix, qu'on peut décocher en retapant dessus. */
const QuestionACocher = ({
  id,
  valeur,
  onChange,
}: {
  id: IdQuestion;
  valeur: string | undefined;
  onChange: (v: string | undefined) => void;
}) => {
  const q = QUESTIONS[id];
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-semibold text-foreground">{q.titre}</legend>
      <div className="flex flex-wrap gap-2">
        {q.choix.map((c) => {
          const actif = valeur === c.value;
          return (
            <button
              key={c.value}
              type="button"
              aria-pressed={actif}
              onClick={() => onChange(actif ? undefined : c.value)}
              className={`min-h-11 rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                actif
                  ? "border-primary bg-primary text-primary-foreground font-semibold"
                  : "border-border bg-card text-foreground hover:border-primary/60"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
};

const Bloc = ({ titre, aide, children }: { titre: string; aide?: string; children: ReactNode }) => (
  <section className="rounded-3xl border border-border/60 bg-card p-5 md:p-8">
    <h3 className="font-display text-xl md:text-2xl font-bold text-foreground">{titre}</h3>
    {aide && <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{aide}</p>}
    <div className="mt-5 space-y-6">{children}</div>
  </section>
);

interface PhotoLocale {
  file: File;
  apercu: string;
}

// ---------------------------------------------------------------------------

const DevisBorneForm = () => {
  const { trackEvent } = useAnalyticsEvents();
  const ouvertA = useRef(Date.now());

  const [reponses, setReponses] = useState<Reponses>({});
  const [textes, setTextes] = useState<Textes>({ modem: "", voiture: "", modeleBorne: "", message: "" });
  const [coord, setCoord] = useState<Coordonnees>({ nom: "", telephone: "", email: "", codePostal: "" });
  const [photos, setPhotos] = useState<Partial<Record<IdPhoto, PhotoLocale>>>({});
  const [erreursPhotos, setErreursPhotos] = useState<Partial<Record<IdPhoto, string>>>({});
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [honeypot, setHoneypot] = useState("");
  const [envoi, setEnvoi] = useState<{ enCours: boolean; faites: number; total: number }>({ enCours: false, faites: 0, total: 0 });
  const [resultat, setResultat] = useState<ResultatEnvoi | null>(null);
  const [echec, setEchec] = useState<string | null>(null);

  // Libère les aperçus en quittant la page.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(
    () => () => {
      Object.values(photosRef.current).forEach((p) => p && URL.revokeObjectURL(p.apercu));
    },
    [],
  );

  const repondre = (id: IdQuestion) => (v: string | undefined) =>
    setReponses((r) => {
      const suite = { ...r };
      if (v === undefined) delete suite[id];
      else suite[id] = v;
      return suite;
    });

  const choisirPhoto = (id: IdPhoto, file: File | undefined) => {
    if (!file) return;
    const typeConnu = file.type === "" || (PHOTO_LIMITES.types as readonly string[]).includes(file.type);
    if (!typeConnu) {
      setErreursPhotos((e) => ({ ...e, [id]: "Ce fichier n'est pas une photo. Choisissez une image." }));
      return;
    }
    if (file.size > PHOTO_LIMITES.maxMoAvantReduction * 1024 * 1024) {
      setErreursPhotos((e) => ({ ...e, [id]: `Cette photo dépasse ${PHOTO_LIMITES.maxMoAvantReduction} Mo.` }));
      return;
    }
    setErreursPhotos((e) => ({ ...e, [id]: undefined }));
    setPhotos((p) => {
      if (p[id]) URL.revokeObjectURL(p[id]!.apercu);
      return { ...p, [id]: { file, apercu: URL.createObjectURL(file) } };
    });
  };

  const retirerPhoto = (id: IdPhoto) =>
    setPhotos((p) => {
      if (p[id]) URL.revokeObjectURL(p[id]!.apercu);
      const suite = { ...p };
      delete suite[id];
      return suite;
    });

  const envoyer = async (ev: FormEvent) => {
    ev.preventDefault();
    if (envoi.enCours) return;
    setEchec(null);

    const e = valider(coord);
    setErreurs(e);
    if (Object.keys(e).length > 0) {
      const premier = e.nom ? "devis-nom" : e.contact || e.telephone ? "devis-tel" : e.email ? "devis-email" : "devis-cp";
      document.getElementById(premier)?.focus();
      return;
    }

    const choisies = PHOTOS.filter((p) => photos[p.id]).map((p) => ({ id: p.id, file: photos[p.id]!.file }));

    // Robot (champ piège rempli) : on affiche la confirmation sans rien envoyer.
    if (honeypot.trim() !== "") {
      setResultat({ dbOk: true, emailOk: true, photosEnvoyees: choisies.length, photosEchouees: 0 });
      return;
    }

    const dureeMs = Date.now() - ouvertA.current;
    setEnvoi({ enCours: true, faites: 0, total: choisies.length });
    try {
      const r = await envoyerDevisBorne(
        { reponses, textes, coordonnees: coord, photos: choisies, dureeMs, suspect: dureeMs < DELAI_SUSPECT_MS },
        (faites, total) => setEnvoi({ enCours: true, faites, total }),
      );
      if (!r.dbOk && !r.emailOk) {
        setEchec("Votre demande n'a pas pu être envoyée. Réessayez, ou appelez le 0485 75 52 27.");
      } else {
        setResultat(r);
        trackEvent("form_submit", { form_name: "devis_borne", has_photos: r.photosEnvoyees > 0 });
        window.scrollTo({ top: 0 });
      }
    } catch {
      setEchec("Une erreur est survenue. Réessayez, ou appelez le 0485 75 52 27.");
    } finally {
      setEnvoi((s) => ({ ...s, enCours: false }));
    }
  };

  const nbPhotos = PHOTOS.filter((p) => photos[p.id]).length;

  return (
    <section id="contact" className="pt-4 md:pt-8 pb-20 md:pb-28 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              {resultat ? (
                <div className="rounded-3xl border border-border/60 bg-card p-6 md:p-10 text-center" role="status">
                  <CheckCircle className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
                  <h2 className="mt-4 font-display text-3xl md:text-4xl font-bold text-foreground">
                    Votre demande est bien partie
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                    Merci{coord.nom.trim() ? `, ${coord.nom.trim().split(/\s+/)[0]}` : ""}. {DELAI}
                  </p>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{RESERVE}</p>
                  {resultat.photosEchouees > 0 && (
                    <p className="mt-4 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
                      {resultat.photosEchouees === 1
                        ? "Une photo n'a pas pu être envoyée."
                        : `${resultat.photosEchouees} photos n'ont pas pu être envoyées.`}{" "}
                      Votre demande est quand même enregistrée : nous vous les redemanderons si besoin.
                    </p>
                  )}
                  <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
                    <Button variant="copper" size="lg" asChild>
                      <Link to="/services/bornes-de-recharge">Retour à la page bornes</Link>
                    </Button>
                    <Button variant="copperOutline" size="lg" asChild>
                      <a href="tel:+32485755227">Appeler le 0485 75 52 27</a>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground leading-tight">
                    Votre devis de borne, sur photos
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                    Quelques cases à cocher et, si possible, cinq photos : c'est ce qu'il nous faut pour
                    chiffrer votre borne sans passer chez vous. Seuls votre nom, un moyen de vous joindre et
                    votre code postal sont obligatoires.
                  </p>
                  <p className="mt-3 text-sm text-foreground">
                    {DELAI} {RESERVE}
                  </p>

                  <form onSubmit={envoyer} noValidate className="mt-8 space-y-6">
                    {/* 1. Le projet */}
                    <Bloc titre="1. Votre projet" aide="Cochez ce que vous savez. Vous pouvez laisser le reste vide.">
                      <QuestionACocher id="logement" valeur={reponses.logement} onChange={repondre("logement")} />
                      {orienterVersZaptecPro(reponses) && (
                        <p className="rounded-xl border border-primary/40 bg-primary/[0.06] px-4 py-3 text-sm text-foreground leading-relaxed">
                          {ORIENTATION_ZAPTEC_PRO}
                        </p>
                      )}
                      <QuestionACocher id="emplacement" valeur={reponses.emplacement} onChange={repondre("emplacement")} />
                      <QuestionACocher id="distance" valeur={reponses.distance} onChange={repondre("distance")} />
                      <QuestionACocher id="borne" valeur={reponses.borne} onChange={repondre("borne")} />
                      {reponses.borne === "deja" && (
                        <div>
                          <label htmlFor="devis-modele" className="mb-2 block text-sm font-semibold text-foreground">
                            Laquelle ? (marque et modèle)
                          </label>
                          <input
                            id="devis-modele"
                            type="text"
                            maxLength={120}
                            className={champ}
                            value={textes.modeleBorne}
                            onChange={(e) => setTextes((t) => ({ ...t, modeleBorne: e.target.value }))}
                          />
                        </div>
                      )}

                      <details className="group rounded-2xl border border-border/60 bg-background px-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                          Plus de précisions (facultatif)
                          <span className="text-sm font-normal text-primary group-open:hidden">Ouvrir</span>
                          <span className="hidden text-sm font-normal text-primary group-open:inline">Fermer</span>
                        </summary>
                        <div className="space-y-6 pb-5">
                          <QuestionACocher id="statut" valeur={reponses.statut} onChange={repondre("statut")} />
                          {demanderAccord(reponses) && (
                            <QuestionACocher id="accord" valeur={reponses.accord} onChange={repondre("accord")} />
                          )}
                          <QuestionACocher id="age" valeur={reponses.age} onChange={repondre("age")} />
                          <QuestionACocher id="passage" valeur={reponses.passage} onChange={repondre("passage")} />
                          <QuestionACocher id="wifi" valeur={reponses.wifi} onChange={repondre("wifi")} />
                          <div>
                            <label htmlFor="devis-modem" className="mb-2 block text-sm font-semibold text-foreground">
                              Où se trouve le modem ?
                            </label>
                            <input
                              id="devis-modem"
                              type="text"
                              maxLength={120}
                              placeholder="Par exemple : dans le salon, à l'étage"
                              className={champ}
                              value={textes.modem}
                              onChange={(e) => setTextes((t) => ({ ...t, modem: e.target.value }))}
                            />
                          </div>
                          <QuestionACocher id="usage" valeur={reponses.usage} onChange={repondre("usage")} />
                          <div>
                            <label htmlFor="devis-voiture" className="mb-2 block text-sm font-semibold text-foreground">
                              Marque et modèle de la voiture
                            </label>
                            <input
                              id="devis-voiture"
                              type="text"
                              maxLength={120}
                              className={champ}
                              value={textes.voiture}
                              onChange={(e) => setTextes((t) => ({ ...t, voiture: e.target.value }))}
                            />
                          </div>
                          <QuestionACocher id="nombre" valeur={reponses.nombre} onChange={repondre("nombre")} />
                          <QuestionACocher id="remplacement" valeur={reponses.remplacement} onChange={repondre("remplacement")} />
                          <QuestionACocher id="panneaux" valeur={reponses.panneaux} onChange={repondre("panneaux")} />
                          <QuestionACocher id="quand" valeur={reponses.quand} onChange={repondre("quand")} />
                        </div>
                      </details>
                    </Bloc>

                    {/* 2. Les photos */}
                    <Bloc
                      titre="2. Vos photos"
                      aide="Conseillées, pas obligatoires : la demande part aussi sans photo. Elles sont réduites avant l'envoi, pour passer même avec une mauvaise connexion."
                    >
                      <ul className="space-y-4">
                        {PHOTOS.map((p, i) => {
                          const locale = photos[p.id];
                          return (
                            <li key={p.id} className="rounded-2xl border border-border/60 bg-background p-4">
                              <div className="flex items-start gap-4">
                                {locale ? (
                                  <img
                                    src={locale.apercu}
                                    alt={`Votre photo : ${p.titre.toLowerCase()}`}
                                    className="h-16 w-20 shrink-0 rounded-lg object-cover"
                                  />
                                ) : (
                                  <Schema id={p.id} />
                                )}
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-semibold text-foreground">
                                    {i + 1}. {p.titre}
                                  </h4>
                                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{p.consigne}</p>
                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <label
                                      htmlFor={`devis-photo-${p.id}`}
                                      className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-primary/60 bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-primary/[0.06] focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                                    >
                                      <Camera className="h-4 w-4 text-primary" aria-hidden="true" />
                                      {locale ? "Changer la photo" : "Ajouter la photo"}
                                      <input
                                        id={`devis-photo-${p.id}`}
                                        type="file"
                                        accept="image/*"
                                        className="sr-only"
                                        onChange={(e) => {
                                          choisirPhoto(p.id, e.target.files?.[0]);
                                          e.target.value = "";
                                        }}
                                      />
                                    </label>
                                    {locale && (
                                      <button
                                        type="button"
                                        onClick={() => retirerPhoto(p.id)}
                                        className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                      >
                                        <X className="h-4 w-4" aria-hidden="true" />
                                        Retirer
                                      </button>
                                    )}
                                  </div>
                                  {erreursPhotos[p.id] && (
                                    <p className="mt-2 text-sm text-destructive" role="alert">
                                      {erreursPhotos[p.id]}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </Bloc>

                    {/* 3. Les coordonnées */}
                    <Bloc titre="3. Vos coordonnées" aide="Un téléphone ou un e-mail suffit, au choix.">
                      <div>
                        <label htmlFor="devis-nom" className="mb-2 block text-sm font-semibold text-foreground">
                          Nom <span className="text-destructive">*</span>
                        </label>
                        <input
                          id="devis-nom"
                          type="text"
                          autoComplete="name"
                          maxLength={100}
                          className={champ}
                          value={coord.nom}
                          aria-invalid={!!erreurs.nom}
                          aria-describedby={erreurs.nom ? "devis-nom-erreur" : undefined}
                          onChange={(e) => setCoord((c) => ({ ...c, nom: e.target.value }))}
                        />
                        {erreurs.nom && (
                          <p id="devis-nom-erreur" className="mt-1 text-sm text-destructive">
                            {erreurs.nom}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label htmlFor="devis-tel" className="mb-2 block text-sm font-semibold text-foreground">
                            Téléphone
                          </label>
                          <input
                            id="devis-tel"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            maxLength={30}
                            className={champ}
                            value={coord.telephone}
                            aria-invalid={!!(erreurs.telephone || erreurs.contact)}
                            aria-describedby={erreurs.telephone || erreurs.contact ? "devis-tel-erreur" : undefined}
                            onChange={(e) => setCoord((c) => ({ ...c, telephone: e.target.value }))}
                          />
                          {(erreurs.telephone || erreurs.contact) && (
                            <p id="devis-tel-erreur" className="mt-1 text-sm text-destructive">
                              {erreurs.telephone ?? erreurs.contact}
                            </p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="devis-email" className="mb-2 block text-sm font-semibold text-foreground">
                            E-mail
                          </label>
                          <input
                            id="devis-email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            maxLength={255}
                            className={champ}
                            value={coord.email}
                            aria-invalid={!!erreurs.email}
                            aria-describedby={erreurs.email ? "devis-email-erreur" : undefined}
                            onChange={(e) => setCoord((c) => ({ ...c, email: e.target.value }))}
                          />
                          {erreurs.email && (
                            <p id="devis-email-erreur" className="mt-1 text-sm text-destructive">
                              {erreurs.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="sm:max-w-[12rem]">
                        <label htmlFor="devis-cp" className="mb-2 block text-sm font-semibold text-foreground">
                          Code postal <span className="text-destructive">*</span>
                        </label>
                        <input
                          id="devis-cp"
                          type="text"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          maxLength={4}
                          className={champ}
                          value={coord.codePostal}
                          aria-invalid={!!erreurs.codePostal}
                          aria-describedby={erreurs.codePostal ? "devis-cp-erreur" : undefined}
                          onChange={(e) => setCoord((c) => ({ ...c, codePostal: e.target.value.replace(/\D/g, "") }))}
                        />
                        {erreurs.codePostal && (
                          <p id="devis-cp-erreur" className="mt-1 text-sm text-destructive">
                            {erreurs.codePostal}
                          </p>
                        )}
                      </div>
                      <QuestionACocher id="suite" valeur={reponses.suite} onChange={repondre("suite")} />
                      <div>
                        <label htmlFor="devis-message" className="mb-2 block text-sm font-semibold text-foreground">
                          Un mot à ajouter ? (facultatif)
                        </label>
                        <textarea
                          id="devis-message"
                          rows={3}
                          maxLength={1500}
                          className={champ}
                          value={textes.message}
                          onChange={(e) => setTextes((t) => ({ ...t, message: e.target.value }))}
                        />
                      </div>

                      {/* Champ piège pour les robots : hors écran, hors tabulation. */}
                      <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
                        <label htmlFor="devis-societe-site">Ne pas remplir</label>
                        <input
                          id="devis-societe-site"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          value={honeypot}
                          onChange={(e) => setHoneypot(e.target.value)}
                        />
                      </div>
                    </Bloc>

                    {echec && (
                      <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                        {echec}
                      </p>
                    )}

                    <Button type="submit" variant="copper" size="lg" className="w-full h-auto min-h-14 whitespace-normal py-4 text-lg" disabled={envoi.enCours}>
                      {envoi.enCours ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                          {envoi.total > 0 && envoi.faites < envoi.total
                            ? `Envoi de la photo ${envoi.faites + 1} sur ${envoi.total}…`
                            : "Envoi de votre demande…"}
                        </>
                      ) : nbPhotos > 0 ? (
                        `Envoyer ma demande et ${nbPhotos === 1 ? "ma photo" : `mes ${nbPhotos} photos`}`
                      ) : (
                        "Envoyer ma demande"
                      )}
                    </Button>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      En envoyant ce formulaire, vous acceptez que vos réponses et vos photos servent à
                      préparer votre devis. Vos photos ne sont visibles que par Adrian Mitric et ne sont
                      jamais publiées. En savoir plus :{" "}
                      <Link to="/confidentialite" className="font-semibold text-primary underline underline-offset-4 hover:no-underline">
                        politique de confidentialité
                      </Link>
                      .
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
    </section>
  );
};

export default DevisBorneForm;
