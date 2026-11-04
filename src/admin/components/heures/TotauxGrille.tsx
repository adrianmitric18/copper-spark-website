/**
 * Quatre tuiles de totaux (heures, km, € forfait, jours) réutilisées par les
 * onglets Semaine et Mois.
 */

import { Card } from "@/components/ui/card";
import { decimalFr, eurosTexte, formaterHeures, type Totaux } from "@/lib/admin/heures";

interface TotauxGrilleProps {
  titre: string;
  t: Totaux;
}

const TotauxGrille = ({ titre, t }: TotauxGrilleProps) => (
  <Card className="p-4">
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{titre}</p>
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div>
        <dt className="text-xs text-muted-foreground">Heures</dt>
        <dd className="text-xl font-display font-bold tabular-nums">{formaterHeures(t.heures)}</dd>
        <dd className="text-xs text-muted-foreground tabular-nums">= {decimalFr(t.heures)} h</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Km</dt>
        <dd className="text-xl font-display font-bold tabular-nums">
          {Number.isInteger(t.km) ? t.km : decimalFr(t.km, 1)}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Forfaits € HT</dt>
        <dd className="text-xl font-display font-bold tabular-nums">{eurosTexte(t.forfait)} €</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Jours</dt>
        <dd className="text-xl font-display font-bold tabular-nums">{t.jours}</dd>
      </div>
    </dl>
  </Card>
);

export default TotauxGrille;
