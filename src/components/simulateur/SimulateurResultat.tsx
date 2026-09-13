/**
 * Simulateur de prix v2 — écrans finaux.
 *
 * Trois sorties possibles :
 *   - le mini-devis indicatif par poste (borne, RGIE, dépannage) ;
 *   - le cas complexe, où l'on n'affiche AUCUN chiffre et où l'on propose une
 *     visite gratuite ;
 *   - l'alerte sécurité, qui coupe tout : une consigne, un bouton d'appel, rien
 *     d'autre.
 *
 * Un poste « à confirmer » n'entre jamais dans le total affiché : le total ne
 * doit jamais être gonflé par un chiffre qu'on n'a pas.
 */

import { useState } from "react";
import { Phone, MessageCircle, CheckCircle2, Ruler, ChevronDown, Wrench, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";
import {
  ALERTE_SECURITE,
  COMMUNES,
  CONTACT,
  DEPANNAGE,
  ECRAN_DEPANNAGE,
  MENTIONS,
  MESSAGE_WHATSAPP_DEPANNAGE,
  MOMENTS,
  MOMENTS_COURTS,
  type Moment,
  type Zone,
} from "@/lib/simulateur/config";
import {
  calculerDevis,
  formatEuros,
  formatFourchette,
  formatLigne,
  type Devis,
  type LigneDevis,
  type Reponses,
} from "@/lib/simulateur/calcul";
import { resumerSimulation } from "@/lib/simulateur/submit";
import { MentionBox } from "./SimulateurUI";

interface Props {
  reponses: Reponses;
  devis: Devis;
  prenom: string;
}

/** Fond anthracite des cartes de prix : identique en clair, en sombre et en mail. */
const FOND_ANTHRACITE =
  "linear-gradient(155deg, #262626 0%, #1F1F1F 55%, #171717 100%)";

// =====================================================================
//  Actions
// =====================================================================

const Actions = ({
  reponses,
  devis,
  contexte,
  libelleAppel,
  libelleWhatsApp,
  gros = false,
}: {
  reponses: Reponses;
  devis: Devis;
  contexte: string;
  libelleAppel: string;
  libelleWhatsApp: string;
  /** Écrans où l'appel est l'action utile : dépannage, alerte sécurité. */
  gros?: boolean;
}) => {
  const { trackEvent } = useAnalyticsEvents();

  const messageWhatsApp =
    reponses.parcours === "depannage"
      ? [MESSAGE_WHATSAPP_DEPANNAGE, "", resumerSimulation(reponses, devis)].join("\n")
      : [
          "Bonjour, je viens de faire une simulation sur votre site.",
          "",
          resumerSimulation(reponses, devis),
          "",
          "Je vous envoie la photo de mon tableau électrique.",
        ].join("\n");

  const lienWhatsApp = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(messageWhatsApp)}`;
  const taille = gros
    ? "min-h-14 py-4 text-lg font-bold"
    : "min-h-11 py-3";

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        variant="copper"
        size="lg"
        asChild
        className={`flex-1 h-auto whitespace-normal text-center leading-snug ${taille}`}
      >
        <a
          href={`tel:${CONTACT.telephone}`}
          data-analytics="call_click"
          onClick={() => trackEvent("call_click", { source_section: contexte })}
        >
          <Phone className="w-4 h-4 mr-2 shrink-0" />
          {libelleAppel}
        </a>
      </Button>
      {/* Bouton WhatsApp en anthracite plein, pour équilibrer le cuivre de
          l'appel. whitespace-normal + h-auto : le libellé est long et débordait
          du bouton sous 430 px, il passe sur deux lignes au lieu d'être coupé. */}
      <Button
        size="lg"
        asChild
        className={`flex-1 h-auto whitespace-normal text-center leading-snug bg-[#1F1F1F] text-white hover:bg-[#2E2E2E] border border-white/10 ${taille}`}
      >
        <a
          href={lienWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          data-analytics="whatsapp_click"
          onClick={() => trackEvent("whatsapp_click", { source_section: contexte })}
        >
          <MessageCircle className="w-4 h-4 mr-2 shrink-0" />
          {libelleWhatsApp}
        </a>
      </Button>
    </div>
  );
};

// =====================================================================
//  Le mini-devis, ligne par ligne
// =====================================================================

/**
 * Un poste. Le montant (ou son absence) est toujours à droite, aligné : c'est
 * ce que l'œil cherche en premier sur un devis.
 *
 * Aucune couleur ne porte à elle seule une information (pas d'emoji non plus) :
 * « à confirmer » et « compris » sont écrits en toutes lettres.
 */
const Poste = ({ ligne }: { ligne: LigneDevis }) => {
  const chiffre = ligne.statut === "chiffre";
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground leading-snug">{ligne.libelle}</p>
        {ligne.detail && (
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
            {ligne.detail}
          </p>
        )}
      </div>
      <p
        className={`shrink-0 font-display font-bold ${
          chiffre
            ? "text-lg text-foreground"
            : ligne.statut === "aConfirmer"
              ? "text-sm text-primary"
              : "text-sm text-muted-foreground"
        }`}
      >
        {formatLigne(ligne)}
      </p>
    </li>
  );
};

/**
 * Bloc de prix, partagé par l'écran de résultat et l'écran dépannage.
 *
 * Carte anthracite profonde, montant en blanc. Couleurs fixes et non tokens de
 * thème : ce bloc doit être identique en clair et en sombre.
 *
 * Ce que le total EXCLUT est porté par l'intitulé, au-dessus du montant — une
 * réserve écrite en petit sous un grand chiffre ne se lit pas.
 */
const CarteMontant = ({
  intitule,
  montant,
  sousTitre,
}: {
  intitule: string;
  montant: string;
  sousTitre?: string;
}) => (
  <div
    className="rounded-3xl border-2 border-primary/60 p-7 md:p-9 text-center shadow-xl shadow-primary/20"
    style={{ background: FOND_ANTHRACITE }}
  >
    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#E86830]">
      {intitule}
    </p>
    <p className="font-display text-[2.125rem] md:text-5xl font-black leading-tight text-white">
      {montant}
    </p>
    {sousTitre && (
      <p className="mt-3 text-sm leading-relaxed text-white/70">{sousTitre}</p>
    )}
  </div>
);

export const EcranDevis = ({ reponses, devis, prenom }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30">
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            Votre estimation
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
            {prenom ? `Voici votre estimation, ${prenom}` : "Voici votre estimation"}
          </h2>
        </div>
      </div>

      {/* Le détail par poste : c'est lui le cœur de l'écran, le total n'en est
          que la somme. */}
      <div className="rounded-3xl border border-border/60 bg-card p-5 md:p-7">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Le détail, poste par poste
        </p>
        <ul className="divide-y divide-border/60">
          {devis.lignes.map((ligne) => (
            <Poste key={ligne.libelle} ligne={ligne} />
          ))}
        </ul>
      </div>

      {devis.total && (
        <CarteMontant
          intitule={devis.intituleTotal}
          montant={formatFourchette(devis.total)}
          sousTitre={devis.sousTitreTotal}
        />
      )}

      {/* Première mention en encadré cuivre : c'est celle qui change ce que le
          visiteur paie ou comprend du prix. */}
      {devis.mentions.slice(0, 1).map((m) => (
        <MentionBox key={m} accent>
          {m}
        </MentionBox>
      ))}
      {devis.mentions.slice(1).map((m) => (
        <MentionBox key={m}>{m}</MentionBox>
      ))}

      {/* Mentions secondaires repliées. <details> plutôt qu'un état React :
          fonctionne sans JavaScript, accessible au clavier par défaut, et rendu
          correctement dans le HTML pré-rendu. */}
      {devis.mentionsRepliees.length > 0 && (
        <details className="group rounded-xl border border-border/60 bg-muted/30">
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground list-none [&::-webkit-details-marker]:hidden">
            Voir les détails
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-primary transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="space-y-3 px-4 pb-4">
            {devis.mentionsRepliees.map((m) => (
              <p key={m} className="text-sm leading-relaxed text-muted-foreground">
                {m}
              </p>
            ))}
          </div>
        </details>
      )}

      <Actions
        reponses={reponses}
        devis={devis}
        contexte="simulateur_resultat"
        libelleAppel="Appeler pour valider ce tarif"
        libelleWhatsApp="Envoyer la photo de mon tableau sur WhatsApp"
      />

      <MentionBox>{MENTIONS.electricienLocal}</MentionBox>
    </motion.div>
  );
};

// =====================================================================
//  Dépannage — un seul écran, le prix avant tout clic
// =====================================================================

/**
 * Le parcours dépannage tient sur un écran.
 *
 * Trois écrans successifs avant de voir un prix, c'était deux de trop pour
 * quelqu'un dont l'installation vient de lâcher (retour d'Adrian après test de
 * la preview). L'ordre est donc : contrôle de sécurité, prix plancher lisible
 * immédiatement, puis deux sélecteurs qui affinent le montant en direct — sans
 * jamais changer de page. Les boutons d'appel restent sous le prix en
 * permanence.
 *
 * Aucun lead n'est enregistré ici, aucune coordonnée n'est demandée.
 */
export const EcranDepannage = ({ onAlerte }: { onAlerte: () => void }) => {
  const { trackEvent } = useAnalyticsEvents();
  const [commune, setCommune] = useState("");
  const [moment, setMoment] = useState<Moment>("journee");

  // « » = commune pas encore choisie : le devis affiche alors le plancher.
  const zone: Zone | undefined =
    commune === ""
      ? undefined
      : commune === "hors"
        ? "hors"
        : COMMUNES.find((c) => c.commune === commune)?.zone;

  const reponses: Reponses = { parcours: "depannage", securite: "rien", moment, zone };
  const devis = calculerDevis(reponses);

  const choisirCommune = (valeur: string) => {
    setCommune(valeur);
    trackEvent("simu_depannage_zone", {
      source_section: "simulateur_depannage",
      zone: valeur === "" ? "aucune" : (COMMUNES.find((c) => c.commune === valeur)?.zone ?? "hors"),
    });
  };

  const choisirMoment = (valeur: Moment) => {
    setMoment(valeur);
    trackEvent("simu_depannage_moment", {
      source_section: "simulateur_depannage",
      moment: valeur,
    });
  };

  const champ =
    "mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-base text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:text-sm";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30">
          <Wrench className="h-5 w-5 text-primary" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            {ECRAN_DEPANNAGE.eyebrow}
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
            {ECRAN_DEPANNAGE.titre}
          </h2>
        </div>
      </div>

      {/* Contrôle de sécurité, en tête d'écran. Une seule affordance : le
          « non » se traduit par ne rien cliquer, ce qui évite un clic à tout le
          monde pour un cas rare. */}
      <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/[0.06] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-display font-bold text-foreground">
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
              {ECRAN_DEPANNAGE.securiteQuestion}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {ECRAN_DEPANNAGE.securiteAide}
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={onAlerte}
            className="shrink-0 whitespace-normal"
          >
            {ECRAN_DEPANNAGE.securiteOui}
          </Button>
        </div>
      </div>

      {/* Le prix, avant le moindre clic. */}
      <CarteMontant
        intitule={devis.total ? devis.intituleTotal : "Main-d'œuvre"}
        montant={
          devis.total
            ? formatFourchette(devis.total)
            : `${formatEuros(DEPANNAGE.mainOeuvre[moment])} / h`
        }
        sousTitre={
          devis.total
            ? devis.sousTitreTotal
            : "hors TVA — déplacement confirmé par téléphone"
        }
      />

      <div className="rounded-3xl border border-border/60 bg-card p-5 md:p-7">
        <ul className="divide-y divide-border/60">
          {devis.lignes.map((ligne) => (
            <Poste key={ligne.libelle} ligne={ligne} />
          ))}
        </ul>

        {/* Les deux sélecteurs : le montant se met à jour au-dessus, sans
            changer d'écran. */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="depannage-commune">{ECRAN_DEPANNAGE.labelCommune}</Label>
            <select
              id="depannage-commune"
              value={commune}
              onChange={(ev) => choisirCommune(ev.target.value)}
              className={champ}
            >
              <option value="">{ECRAN_DEPANNAGE.invitePrecision}</option>
              {COMMUNES.map((c) => (
                <option key={c.commune} value={c.commune}>
                  {c.commune}
                </option>
              ))}
              <option value="hors">{ECRAN_DEPANNAGE.optionHorsListe}</option>
            </select>
          </div>

          <div>
            <span className="text-sm font-medium text-foreground">
              {ECRAN_DEPANNAGE.labelMoment}
            </span>
            <div className="mt-1.5 flex flex-col gap-2">
              {MOMENTS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => choisirMoment(m.value)}
                  aria-pressed={moment === m.value}
                  className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    moment === m.value
                      ? "border-primary bg-primary/[0.07] text-foreground"
                      : "border-border/70 bg-card text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {/* Pastille de sélection en CSS, sans emoji. */}
                  <span
                    aria-hidden="true"
                    className={`h-3 w-3 shrink-0 rounded-full border-2 transition-colors ${
                      moment === m.value ? "border-primary bg-primary" : "border-border"
                    }`}
                  />
                  {MOMENTS_COURTS[m.value]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Appeler reste sous le prix, en permanence : c'est l'action utile quand
          il n'y a plus de courant. */}
      <Actions
        reponses={reponses}
        devis={devis}
        gros
        contexte="simulateur_depannage"
        libelleAppel={`Appeler le ${CONTACT.telephoneAffiche}`}
        libelleWhatsApp="Décrire ma panne sur WhatsApp"
      />

      {devis.mentions.slice(0, 1).map((m) => (
        <MentionBox key={m} accent>
          {m}
        </MentionBox>
      ))}
      {devis.mentions.slice(1).map((m) => (
        <MentionBox key={m}>{m}</MentionBox>
      ))}

      <MentionBox>{MENTIONS.depannagePasDeFormulaire}</MentionBox>
      <MentionBox>{MENTIONS.electricienLocal}</MentionBox>
    </motion.div>
  );
};

// =====================================================================
//  Cas complexe — aucun chiffre affiché
// =====================================================================

export const EcranComplexe = ({ reponses, devis, prenom }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="space-y-6"
  >
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30">
        <Ruler className="h-5 w-5 text-primary" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
          Demande enregistrée
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
          {prenom ? `${prenom}, votre` : "Votre"} projet mérite une visite
        </h2>
      </div>
    </div>

    <p className="text-lg text-foreground leading-relaxed">{MENTIONS.casComplexe}</p>

    {devis.raisonsComplexe.length > 0 && (
      <ul className="space-y-2">
        {devis.raisonsComplexe.map((raison) => (
          <li key={raison} className="flex items-start gap-3 text-muted-foreground">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span className="leading-relaxed">{raison}</span>
          </li>
        ))}
      </ul>
    )}

    <MentionBox>
      Donner une fourchette sur ce type de chantier sans l'avoir vu reviendrait à
      avancer un chiffre au hasard. Le déplacement et la visite sont gratuits.
    </MentionBox>

    <Actions
      reponses={reponses}
      devis={devis}
      contexte="simulateur_complexe"
      libelleAppel="Appeler pour organiser la visite"
      libelleWhatsApp="Envoyer la photo de mon tableau sur WhatsApp"
    />

    <MentionBox>{MENTIONS.electricienLocal}</MentionBox>
  </motion.div>
);

// =====================================================================
//  Alerte sécurité — aucune question, aucun formulaire, aucun prix
// =====================================================================

/**
 * Sortie immédiate du parcours dépannage. Une odeur de brûlé ou des étincelles
 * ne se chiffrent pas : on donne la consigne qui protège, puis le numéro. Rien
 * d'autre ne doit apparaître sur cet écran — surtout pas un formulaire.
 */
export const EcranAlerteSecurite = () => {
  const { trackEvent } = useAnalyticsEvents();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/40">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-destructive">
            Sécurité
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
            {ALERTE_SECURITE.titre}
          </h2>
        </div>
      </div>

      {/* Les secours d'abord, et en premier dans l'ordre de lecture : cet écran
          se déclenche sur « fumée, étincelles, odeur de brûlé ». Le geste au
          tableau vient après, et seulement s'il est sans danger. */}
      <div
        className="rounded-3xl border-2 border-destructive/60 p-7 md:p-9 shadow-xl shadow-destructive/20"
        style={{ background: FOND_ANTHRACITE }}
      >
        <p className="font-display text-xl md:text-2xl font-black leading-snug text-white">
          {ALERTE_SECURITE.urgence}
        </p>
        <p className="mt-5 leading-relaxed text-white/85">{ALERTE_SECURITE.consigne}</p>
        <p className="mt-3 leading-relaxed text-white/70">{ALERTE_SECURITE.precision}</p>
      </div>

      <Button
        variant="copper"
        size="lg"
        asChild
        className="w-full h-auto min-h-16 whitespace-normal py-5 text-center text-xl font-black leading-snug"
      >
        <a
          href={`tel:${CONTACT.telephone}`}
          data-analytics="call_click"
          onClick={() => trackEvent("call_click", { source_section: "simulateur_alerte" })}
        >
          <Phone className="w-6 h-6 mr-3 shrink-0" />
          Appeler le {CONTACT.telephoneAffiche}
        </a>
      </Button>

      <MentionBox>{MENTIONS.electricienLocal}</MentionBox>
    </motion.div>
  );
};
