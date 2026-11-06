/**
 * Dépannage au téléphone (admin) — logique pure.
 *
 * LA GRILLE N'EST PAS ICI. Les montants vivent dans UN SEUL fichier,
 * `src/lib/simulateur/config.ts` (`ZONES[].forfait`, `DEPANNAGE`), que le site
 * public affiche déjà (grille du 25/10/2026, HTVA). Ce module ne fait que la
 * lire : changer un prix là-bas le change sur le site ET dans l'admin, il n'y
 * a pas de second jeu de nombres à tenir à jour.
 *
 * Ce qui est propre à l'admin (jamais affiché au client) est ici : la marge
 * sur le matériel et le texte WhatsApp qu'Adrian envoie après l'appel.
 */

import {
  DEPANNAGE,
  PLAGE_JOUR,
  SAMEDI_AU_TARIF_WEEKEND,
  ZONES,
  type Moment,
  type Zone,
} from "@/lib/simulateur/config";

export type { Moment, Zone };

/** Marge appliquée au matériel, après accord du client. Interne : pas sur le site. */
export const MARGE_MATERIEL_POURCENT = 30;

/** Signature demandée par Adrian pour ce message (brief admin 2026-11, 2b.3). */
export const SIGNATURE_DEPANNAGE = "Adrian Mitric – Le Cuivre Électrique / 0485 755 227";

/** Type de visite pré-choisi quand on crée le RDV depuis l'écran dépannage. */
export const TYPE_VISITE_DEPANNAGE = "Intervention - Dépannage";

export const MOMENTS: { value: Moment; label: string; detail: string }[] = [
  {
    value: "jour",
    label: "Jour",
    detail: `Lundi au ${SAMEDI_AU_TARIF_WEEKEND ? "vendredi" : "samedi"}, ${PLAGE_JOUR.debut} h – ${PLAGE_JOUR.fin} h`,
  },
  {
    value: "nuitWeekend",
    label: SAMEDI_AU_TARIF_WEEKEND ? "Soir, nuit, week-end" : "Soir, nuit, dimanche",
    detail: `Après ${PLAGE_JOUR.fin} h, avant ${PLAGE_JOUR.debut} h, ${SAMEDI_AU_TARIF_WEEKEND ? "week-end" : "dimanche"}, férié`,
  },
];

export interface PrixDepannage {
  zone: Zone;
  zoneLabel: string;
  moment: Moment;
  /** Forfait déplacement + première heure, HTVA. */
  forfait: number;
  /** Demi-heure supplémentaire entamée, HTVA. */
  demiHeure: number;
  /** Supplément du tarif soir / nuit / dimanche par rapport au jour, pour cette zone. */
  supplementHorsJour: number;
  communes: string[];
}

export const prixDepannage = (zone: Zone, moment: Moment): PrixDepannage => {
  const z = ZONES.find((x) => x.value === zone);
  if (!z) throw new Error(`Zone inconnue : ${zone}`);
  return {
    zone,
    zoneLabel: z.label,
    moment,
    forfait: z.forfait[moment],
    demiHeure: DEPANNAGE.demiHeureSupplementaire[moment],
    supplementHorsJour: z.forfait.nuitWeekend - z.forfait.jour,
    communes: z.communes,
  };
};

/** Retrouve la zone d'une commune tapée au clavier (accents et casse ignorés). */
const sansAccent = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const zoneDeLaCommune = (saisie: string): Zone | null => {
  const q = sansAccent(saisie);
  if (q.length < 3) return null;
  const exacte = ZONES.find((z) => z.communes.some((c) => sansAccent(c) === q));
  if (exacte) return exacte.value;
  const debut = ZONES.filter((z) => z.communes.some((c) => sansAccent(c).startsWith(q)));
  return debut.length === 1 ? debut[0].value : null;
};

/**
 * Message WhatsApp envoyé après l'appel : le prix annoncé, ce qui est compris,
 * le matériel en plus après accord, le paiement sur place, la signature.
 * La marge sur le matériel n'y figure pas (interne).
 */
export const texteWhatsappDepannage = (zone: Zone, moment: Moment, prenom?: string): string => {
  const p = prixDepannage(zone, moment);
  const quand =
    moment === "jour"
      ? "en journée"
      : SAMEDI_AU_TARIF_WEEKEND
        ? "en soirée, la nuit ou le week-end"
        : "en soirée, la nuit, le dimanche ou un jour férié";
  const bonjour = prenom?.trim() ? `Bonjour ${prenom.trim().split(/\s+/)[0]},` : "Bonjour,";
  return [
    `${bonjour} voici ce que je vous ai annoncé pour votre dépannage ${quand} :`,
    "",
    `• Forfait : ${p.forfait} € HTVA, déplacement et première heure compris.`,
    `• Ensuite : ${p.demiHeure} € HTVA par demi-heure supplémentaire entamée.`,
    "• Le matériel éventuellement nécessaire est en plus, toujours après votre accord.",
    "• Paiement immédiat sur place, par QR code.",
    "",
    SIGNATURE_DEPANNAGE,
  ].join("\n");
};
