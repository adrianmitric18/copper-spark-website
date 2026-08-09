/**
 * Simulateur de prix — écrans finaux.
 *
 * Deux sorties possibles :
 *   - une fourchette indicative (jamais un prix ferme) ;
 *   - un cas complexe, où l'on n'affiche AUCUN chiffre et où l'on propose un
 *     métré technique gratuit.
 *
 * Dans les deux cas, les mêmes deux actions : appeler, ou envoyer la photo du
 * tableau sur WhatsApp avec le résumé pré-rempli.
 */

import { Phone, MessageCircle, CheckCircle2, Ruler, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";
import { CONTACT, MENTIONS } from "@/lib/simulateur/config";
import { formatFourchette, type Estimation, type ReponsesSimulateur } from "@/lib/simulateur/calcul";
import { resumerSimulation } from "@/lib/simulateur/submit";
import { MentionBox } from "./SimulateurUI";

interface Props {
  reponses: ReponsesSimulateur;
  estimation: Estimation;
  prenom: string;
}

/** Boutons d'action, identiques sur les deux écrans finaux. */
const Actions = ({
  reponses,
  estimation,
  contexte,
  libelleAppel,
}: {
  reponses: ReponsesSimulateur;
  estimation: Estimation;
  contexte: string;
  /** Le cas complexe n'affiche aucun tarif : parler de « valider ce tarif »
      y serait incohérent. */
  libelleAppel: string;
}) => {
  const { trackEvent } = useAnalyticsEvents();

  const messageWhatsApp = [
    "Bonjour, je viens de faire une simulation sur votre site.",
    "",
    resumerSimulation(reponses, estimation),
    "",
    "Je vous envoie la photo de mon tableau électrique.",
  ].join("\n");

  const lienWhatsApp = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(messageWhatsApp)}`;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        variant="copper"
        size="lg"
        asChild
        className="flex-1 h-auto min-h-11 whitespace-normal py-3 text-center leading-snug"
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
        className="flex-1 h-auto min-h-11 whitespace-normal py-3 text-center leading-snug bg-[#1F1F1F] text-white hover:bg-[#2E2E2E] border border-white/10"
      >
        <a
          href={lienWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          data-analytics="whatsapp_click"
          onClick={() => trackEvent("whatsapp_click", { source_section: contexte })}
        >
          <MessageCircle className="w-4 h-4 mr-2 shrink-0" />
          Envoyer la photo de mon tableau sur WhatsApp
        </a>
      </Button>
    </div>
  );
};

// =====================================================================
//  Cas complexe — aucun chiffre affiché
// =====================================================================

export const EcranComplexe = ({ reponses, estimation, prenom }: Props) => (
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
          {prenom ? `${prenom}, votre` : "Votre"} projet mérite un métré
        </h2>
      </div>
    </div>

    <p className="text-lg text-foreground leading-relaxed">{MENTIONS.casComplexe}</p>

    {estimation.raisonsComplexe.length > 0 && (
      <ul className="space-y-2">
        {estimation.raisonsComplexe.map((raison) => (
          <li key={raison} className="flex items-start gap-3 text-muted-foreground">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span className="leading-relaxed">{raison}</span>
          </li>
        ))}
      </ul>
    )}

    <MentionBox>
      Donner une fourchette sur ce type de chantier sans l'avoir vu reviendrait à
      avancer un chiffre au hasard. Le déplacement et le métré sont gratuits.
    </MentionBox>

    <Actions
      reponses={reponses}
      estimation={estimation}
      contexte="simulateur_complexe"
      libelleAppel="Appeler pour organiser le métré"
    />
  </motion.div>
);

// =====================================================================
//  Fourchette indicative
// =====================================================================

export const EcranResultat = ({ reponses, estimation, prenom }: Props) => {
  const societe = reponses.usage === "societe";

  // Répartition des mentions entre ce qui reste sous les yeux et ce qui passe
  // derrière « Voir les détails ». Ne se replient que les informations qui ne
  // changent pas le montant à payer : avantages fiscaux société, modalités de
  // facturation, split-billing, et le rappel que le contrôle de l'organisme est
  // hors fourchette. Le forfait RGIE, lui, est un vrai surcoût : il reste
  // visible en permanence.
  const mentionsVisibles = estimation.mentions.filter(
    (m) => m !== MENTIONS.organismeNonInclus,
  );

  const mentionsRepliees = [
    ...(estimation.mentions.includes(MENTIONS.organismeNonInclus)
      ? [MENTIONS.organismeNonInclus]
      : []),
    ...(societe
      ? [
          MENTIONS.deductionSociete,
          MENTIONS.facturationSociete,
          ...(estimation.borne ? [MENTIONS.splitBilling] : []),
        ]
      : []),
  ];

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

      {/* Fourchette principale — carte anthracite profonde, montant en blanc.
          Couleurs fixes et non tokens de thème : ce bloc doit être identique en
          clair, en sombre et dans l'email de confirmation. */}
      {estimation.total && (
        <div
          className="rounded-3xl border-2 border-primary/60 p-7 md:p-9 text-center shadow-xl shadow-primary/20"
          style={{
            background:
              "linear-gradient(155deg, #262626 0%, #1F1F1F 55%, #171717 100%)",
          }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#E86830]">
            {estimation.borne && estimation.rgie
              ? "Estimation globale, TVA comprise"
              : "Estimation TVA comprise"}
          </p>
          <p className="font-display text-[2.125rem] md:text-5xl font-black leading-tight text-white">
            {formatFourchette(estimation.total)}
          </p>
        </div>
      )}

      {/* Détail quand les deux chantiers sont demandés */}
      {estimation.borne && estimation.rgie && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <p className="text-sm text-muted-foreground mb-1">Borne de recharge</p>
            <p className="font-display text-xl font-bold text-foreground">
              {formatFourchette(estimation.borne)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <p className="text-sm text-muted-foreground mb-1">Mise en conformité RGIE</p>
            <p className="font-display text-xl font-bold text-foreground">
              {formatFourchette(estimation.rgie)}
            </p>
          </div>
        </div>
      )}

      {/* Toujours visible : la TVA réduite change le prix payé, elle ne se
          replie pas. Idem pour le forfait RGIE, qui est un coût supplémentaire
          et doit rester sous les yeux. */}
      <MentionBox accent>{MENTIONS.tvaReduite}</MentionBox>

      {mentionsVisibles.map((m) => (
        <MentionBox key={m}>{m}</MentionBox>
      ))}

      {/* Mentions secondaires repliées. <details> plutôt qu'un état React :
          fonctionne sans JavaScript, accessible au clavier par défaut, et rendu
          correctement dans le HTML pré-rendu. */}
      {mentionsRepliees.length > 0 && (
        <details className="group rounded-xl border border-border/60 bg-muted/30">
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground list-none [&::-webkit-details-marker]:hidden">
            Voir les détails
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-primary transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="space-y-3 px-4 pb-4">
            {mentionsRepliees.map((m) => (
              <p key={m} className="text-sm leading-relaxed text-muted-foreground">
                {m}
              </p>
            ))}
          </div>
        </details>
      )}

      <MentionBox>{MENTIONS.estimationIndicative}</MentionBox>

      <Actions
        reponses={reponses}
        estimation={estimation}
        contexte="simulateur_resultat"
        libelleAppel="Appeler pour valider ce tarif"
      />
    </motion.div>
  );
};
