// Décompte des demandes de bornes par mois, pour l'écran /admin/demandes-bornes.
//
// Deux sources :
//   - les leads (formulaire de contact et simulateur), déjà dans l'admin ;
//   - le compteur anonyme des clics WhatsApp et téléphone de la page bornes
//     (table `compteur_clics`), qui ne contient que des nombres par jour.
// Logique pure, testée dans demandes-bornes.test.ts.

/** Libellé du service « borne », identique dans le formulaire et le simulateur. */
export const SERVICE_BORNE = "Borne de recharge voiture électrique";

export interface LeadPourDecompte {
  created_at: string;
  source?: string | null;
  services?: string[] | null;
}

export interface LigneCompteur {
  jour: string; // AAAA-MM-JJ
  page: string;
  action: string;
  nombre: number;
}

export interface MoisBornes {
  /** AAAA-MM */
  mois: string;
  formulaire: number;
  simulateur: number;
  /** Formulaire /devis-borne (origine « devis_borne »). */
  devisPhotos: number;
  whatsapp: number;
  telephone: number;
}

/** Mois (AAAA-MM) d'une date ISO, à l'heure de Bruxelles. */
export function moisDe(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 7);
  const parts = new Intl.DateTimeFormat("fr-BE", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(d);
  const annee = parts.find((p) => p.type === "year")?.value ?? "";
  const mois = parts.find((p) => p.type === "month")?.value ?? "";
  return `${annee}-${mois}`;
}

export const estDemandeBorne = (lead: LeadPourDecompte): boolean =>
  (lead.services ?? []).includes(SERVICE_BORNE);

/**
 * Une ligne par mois où il s'est passé quelque chose, du plus récent au plus
 * ancien. Un lead du simulateur a `source = 'simulateur'`, une demande du
 * formulaire /devis-borne a `source = 'devis_borne'` ; tout le reste
 * (formulaire de contact, saisie manuelle) est compté en « formulaire ».
 */
export function decompteParMois(leads: LeadPourDecompte[], compteur: LigneCompteur[]): MoisBornes[] {
  const parMois = new Map<string, MoisBornes>();
  const ligne = (mois: string): MoisBornes => {
    let l = parMois.get(mois);
    if (!l) {
      l = { mois, formulaire: 0, simulateur: 0, devisPhotos: 0, whatsapp: 0, telephone: 0 };
      parMois.set(mois, l);
    }
    return l;
  };

  for (const lead of leads) {
    if (!estDemandeBorne(lead)) continue;
    const l = ligne(moisDe(lead.created_at));
    if (lead.source === "simulateur") l.simulateur += 1;
    else if (lead.source === "devis_borne") l.devisPhotos += 1;
    else l.formulaire += 1;
  }

  for (const c of compteur) {
    if (c.page !== "bornes") continue;
    const l = ligne(c.jour.slice(0, 7));
    if (c.action === "whatsapp") l.whatsapp += c.nombre;
    else if (c.action === "telephone") l.telephone += c.nombre;
  }

  return [...parMois.values()].sort((a, b) => b.mois.localeCompare(a.mois));
}

/** « novembre 2026 » */
export function libelleMois(mois: string): string {
  const [annee, m] = mois.split("-").map(Number);
  if (!annee || !m) return mois;
  return new Date(Date.UTC(annee, m - 1, 15)).toLocaleDateString("fr-BE", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
