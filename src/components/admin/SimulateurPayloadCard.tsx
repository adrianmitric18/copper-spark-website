import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, AlertTriangle } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

/**
 * Affiche les réponses d'un lead issu du simulateur de prix.
 *
 * Le payload est du JSONB libre : on ne fait confiance à rien et on lit chaque
 * champ défensivement. Un lead venu d'une ancienne version du parcours doit
 * rester lisible plutôt que de casser la fiche — d'où les deux blocs de
 * lecture : `version: 2` (devis par postes, depuis le 2026-09-13) et les leads
 * v1 (fourchettes borne / RGIE), qui restent en base.
 */

interface Fourchette {
  min?: number;
  max?: number;
}

interface LigneDevis {
  libelle?: string;
  statut?: string;
  min?: number | null;
  max?: number | null;
}

const euros = (n: number) =>
  new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

const texte = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v : null;

const fourchette = (v: unknown): string | null => {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const f = v as Fourchette;
  if (typeof f.min !== "number" || typeof f.max !== "number") return null;
  return f.min === f.max ? euros(f.min) : `${euros(f.min)} – ${euros(f.max)}`;
};

const STATUTS: Record<string, string> = {
  compris: "compris",
  aConfirmer: "à confirmer",
  surDevis: "sur devis",
};

const montantLigne = (l: LigneDevis): string => {
  if (typeof l.min === "number" && typeof l.max === "number") {
    return l.min === l.max ? euros(l.min) : `${euros(l.min)} – ${euros(l.max)}`;
  }
  return STATUTS[l.statut ?? ""] ?? "—";
};

const Ligne = ({ label, valeur }: { label: string; valeur: string }) => (
  <div className="text-sm">
    <span className="text-muted-foreground">{label} :</span> {valeur}
  </div>
);

const SimulateurPayloadCard = ({ payload }: { payload: Json | null }) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const p = payload as Record<string, Json | undefined>;

  const complexe = p.complexe === true;
  const suspect = p.soumission_suspecte === true;
  const raisons = Array.isArray(p.raisons_complexe)
    ? (p.raisons_complexe.filter((r) => typeof r === "string") as string[])
    : [];

  const dureeMs = typeof p.duree_ms === "number" ? p.duree_ms : null;

  // Devis par postes : uniquement sur les leads v2.
  const lignesDevis: LigneDevis[] = Array.isArray(p.lignes_devis)
    ? (p.lignes_devis.filter(
        (l) => !!l && typeof l === "object" && !Array.isArray(l),
      ) as unknown as LigneDevis[])
    : [];

  const preference = texte(p.preference_rappel_label);
  const veutEtreRappele = p.preference_rappel === "rappel";

  return (
    <Card className="p-6 space-y-4 border-primary/40">
      <div className="flex flex-wrap items-center gap-2">
        <Calculator className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-lg">Réponses du simulateur</h2>
        {complexe && (
          <Badge className="bg-orange-500/15 text-orange-600 border-orange-500/30">
            Cas complexe — visite requise
          </Badge>
        )}
        {/* Pastille de couleur en CSS, pas d'emoji : le vert dit « à rappeler
            en priorité », le gris « veut juste voir les prix ». */}
        {preference && (
          <Badge
            variant="outline"
            className={
              veutEtreRappele
                ? "border-emerald-500/40 text-emerald-600"
                : "border-border text-muted-foreground"
            }
          >
            <span
              aria-hidden="true"
              className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
                veutEtreRappele ? "bg-emerald-500" : "bg-muted-foreground/60"
              }`}
            />
            {preference}
          </Badge>
        )}
        {suspect && (
          <Badge className="bg-destructive/10 text-destructive border-destructive/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Envoi suspect
          </Badge>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {/* `parcours_label` est le champ v2 ; `besoin_label` celui des leads v1. */}
        {texte(p.parcours_label ?? p.besoin_label) && (
          <Ligne label="Parcours" valeur={texte(p.parcours_label ?? p.besoin_label)!} />
        )}
        {texte(p.fournisseur_label) && (
          <Ligne label="Fourniture de la borne" valeur={texte(p.fournisseur_label)!} />
        )}
        {texte(p.modele_borne) && (
          <Ligne label="Modèle indiqué" valeur={texte(p.modele_borne)!} />
        )}
        {texte(p.distance_label) && (
          <Ligne label="Distance borne / tableau" valeur={texte(p.distance_label)!} />
        )}
        {texte(p.tableau_label ?? p.installation_label) && (
          <Ligne
            label="État du tableau"
            valeur={texte(p.tableau_label ?? p.installation_label)!}
          />
        )}
        {texte(p.nombre_tableaux_label) && (
          <Ligne label="Nombre de tableaux" valeur={texte(p.nombre_tableaux_label)!} />
        )}
        {texte(p.age_logement_label) && (
          <Ligne label="Âge du logement" valeur={texte(p.age_logement_label)!} />
        )}
        {/* Parcours RGIE : la question d'usage n'est pas posée, c'est le motif
            de la mise en conformité qui la remplace. */}
        {texte(p.contexte_rgie_label) ? (
          <Ligne
            label="Motif de la mise en conformité"
            valeur={texte(p.contexte_rgie_label)!}
          />
        ) : (
          texte(p.usage_label) && <Ligne label="Usage" valeur={texte(p.usage_label)!} />
        )}
      </div>

      {complexe ? (
        <div className="rounded-md bg-muted/50 p-4 text-sm space-y-1">
          <p className="font-medium">Aucun prix affiché au client.</p>
          {raisons.map((r) => (
            <p key={r} className="text-muted-foreground">
              · {r}
            </p>
          ))}
        </div>
      ) : lignesDevis.length > 0 ? (
        <div className="rounded-md bg-muted/50 p-4 space-y-2">
          <p className="text-sm text-muted-foreground">Devis vu par le client</p>
          <ul className="space-y-1">
            {lignesDevis.map((l, i) => (
              <li
                key={`${l.libelle ?? "ligne"}-${i}`}
                className="flex flex-wrap justify-between gap-x-4 text-sm"
              >
                <span className="min-w-0">{l.libelle ?? "Poste"}</span>
                <span className="font-medium">{montantLigne(l)}</span>
              </li>
            ))}
          </ul>
          {texte(p.total_affiche) && (
            <p className="pt-1 font-semibold">Total annoncé : {texte(p.total_affiche)}</p>
          )}
          {p.postes_a_confirmer === true && (
            <p className="text-xs text-muted-foreground">
              Des postes restaient à confirmer : ils n'étaient pas compris dans ce total.
            </p>
          )}
        </div>
      ) : (
        // Leads v1 : deux fourchettes, pas de détail par poste.
        <div className="rounded-md bg-muted/50 p-4 space-y-2">
          <p className="text-sm text-muted-foreground">Fourchette vue par le client</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {fourchette(p.fourchette_borne) && (
              <Ligne label="Borne de recharge" valeur={fourchette(p.fourchette_borne)!} />
            )}
            {fourchette(p.fourchette_rgie) && (
              <Ligne label="Mise en conformité RGIE" valeur={fourchette(p.fourchette_rgie)!} />
            )}
          </div>
          {fourchette(p.fourchette_totale) && (
            <p className="font-semibold">Total annoncé : {fourchette(p.fourchette_totale)}</p>
          )}
        </div>
      )}

      {dureeMs !== null && (
        <p className="text-xs text-muted-foreground">
          Parcours complété en {Math.round(dureeMs / 1000)} s
          {texte(p.envoye_le) && ` · ${new Date(texte(p.envoye_le)!).toLocaleString("fr-BE")}`}
        </p>
      )}
    </Card>
  );
};

export default SimulateurPayloadCard;
