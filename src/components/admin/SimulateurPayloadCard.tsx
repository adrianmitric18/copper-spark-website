import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, AlertTriangle } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

/**
 * Affiche les réponses d'un lead issu du simulateur de prix.
 *
 * Le payload est du JSONB libre : on ne fait confiance à rien et on lit chaque
 * champ défensivement. Un lead venu d'une ancienne version du parcours doit
 * rester lisible plutôt que de casser la fiche.
 */

interface Fourchette {
  min?: number;
  max?: number;
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
  return f.min === f.max ? `à partir de ${euros(f.min)}` : `${euros(f.min)} – ${euros(f.max)}`;
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

  return (
    <Card className="p-6 space-y-4 border-primary/40">
      <div className="flex flex-wrap items-center gap-2">
        <Calculator className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-lg">Réponses du simulateur</h2>
        {complexe && (
          <Badge className="bg-orange-500/15 text-orange-600 border-orange-500/30">
            Cas complexe — métré requis
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
        {texte(p.besoin_label) && <Ligne label="Besoin" valeur={texte(p.besoin_label)!} />}
        {texte(p.distance_label) && (
          <Ligne label="Distance borne / tableau" valeur={texte(p.distance_label)!} />
        )}
        {texte(p.installation_label) && (
          <Ligne label="Installation" valeur={texte(p.installation_label)!} />
        )}
        {/* Parcours RGIE seul : la question d'usage n'est pas posée, c'est le
            motif de la mise en conformité qui la remplace. */}
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
          <p className="font-medium">Aucune fourchette affichée au client.</p>
          {raisons.map((r) => (
            <p key={r} className="text-muted-foreground">
              · {r}
            </p>
          ))}
        </div>
      ) : (
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
