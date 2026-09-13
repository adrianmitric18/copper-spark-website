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

import { Phone, MessageCircle, CheckCircle2, Ruler, ChevronDown, Wrench, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";
import {
  ALERTE_SECURITE,
  CONTACT,
  MENTIONS,
  MESSAGE_WHATSAPP_DEPANNAGE,
  type Parcours,
} from "@/lib/simulateur/config";
import {
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

const EN_TETE: Record<Parcours, { eyebrow: string; titre: (p: string) => string }> = {
  borne: {
    eyebrow: "Votre estimation",
    titre: (p) => (p ? `Voici votre estimation, ${p}` : "Voici votre estimation"),
  },
  rgie: {
    eyebrow: "Votre estimation",
    titre: (p) => (p ? `Voici votre estimation, ${p}` : "Voici votre estimation"),
  },
  depannage: {
    eyebrow: "Dépannage",
    titre: () => "Voici ce que coûte l'intervention",
  },
};

export const EcranDevis = ({ reponses, devis, prenom }: Props) => {
  const depannage = devis.parcours === "depannage";
  const entete = EN_TETE[devis.parcours];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30">
          {depannage ? (
            <Wrench className="h-5 w-5 text-primary" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          )}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            {entete.eyebrow}
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
            {entete.titre(prenom)}
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

      {/* Total — carte anthracite profonde, montant en blanc. Couleurs fixes et
          non tokens de thème : ce bloc doit être identique en clair et en
          sombre. */}
      {devis.total && (
        <div
          className="rounded-3xl border-2 border-primary/60 p-7 md:p-9 text-center shadow-xl shadow-primary/20"
          style={{ background: FOND_ANTHRACITE }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#E86830]">
            {devis.intituleTotal}
          </p>
          <p className="font-display text-[2.125rem] md:text-5xl font-black leading-tight text-white">
            {formatFourchette(devis.total)}
          </p>
          {devis.aConfirmer && (
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Hors postes « à confirmer » ci-dessus.
            </p>
          )}
        </div>
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
        gros={depannage}
        contexte={depannage ? "simulateur_depannage" : "simulateur_resultat"}
        libelleAppel={
          depannage ? `Appeler le ${CONTACT.telephoneAffiche}` : "Appeler pour valider ce tarif"
        }
        libelleWhatsApp={
          depannage
            ? "Décrire ma panne sur WhatsApp"
            : "Envoyer la photo de mon tableau sur WhatsApp"
        }
      />

      {depannage && <MentionBox>{MENTIONS.depannagePasDeFormulaire}</MentionBox>}
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

      <div
        className="rounded-3xl border-2 border-destructive/60 p-7 md:p-9 shadow-xl shadow-destructive/20"
        style={{ background: FOND_ANTHRACITE }}
      >
        <p className="font-display text-xl md:text-2xl font-bold leading-snug text-white">
          {ALERTE_SECURITE.consigne}
        </p>
        <p className="mt-4 leading-relaxed text-white/70">{ALERTE_SECURITE.precision}</p>
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
