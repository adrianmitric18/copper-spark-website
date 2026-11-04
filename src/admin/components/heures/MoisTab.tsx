/**
 * Onglet « Mois » : totaux du mois par type (heures, km, € forfait, jours
 * travaillés) avec navigation mois précédent / suivant.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  TYPES_HEURES,
  TYPE_LABELS,
  dansPeriode,
  decimalFr,
  eurosTexte,
  formaterHeures,
  moisDe,
  moisSuivant,
  todayIso,
  totauxParType,
  type Heure,
  type Totaux,
} from "@/lib/admin/heures";
import TotauxGrille from "@/admin/components/heures/TotauxGrille";

interface MoisTabProps {
  lignes: Heure[];
  /** Une date du mois affiché (AAAA-MM-JJ). */
  dateRef: string;
  onChangerDate: (iso: string) => void;
}

const kmTexte = (km: number): string => (Number.isInteger(km) ? String(km) : decimalFr(km, 1));

const Ligne = ({ libelle, v, gras }: { libelle: string; v: Totaux; gras?: boolean }) => (
  <tr className={gras ? "font-bold border-t-2 border-border" : "border-t border-border/50"}>
    <th scope="row" className="py-2.5 pr-2 text-left font-medium">
      {libelle}
    </th>
    <td className="py-2.5 px-1 text-right tabular-nums">{formaterHeures(v.heures)}</td>
    <td className="py-2.5 px-1 text-right tabular-nums">{kmTexte(v.km)}</td>
    <td className="py-2.5 px-1 text-right tabular-nums">{eurosTexte(v.forfait)}</td>
    <td className="py-2.5 pl-1 text-right tabular-nums">{v.jours}</td>
  </tr>
);

const MoisTab = ({ lignes, dateRef, onChangerDate }: MoisTabProps) => {
  const mois = moisDe(dateRef);
  const aujourdhui = todayIso();
  const estCourant = dansPeriode(aujourdhui, mois);
  const dansMois = lignes.filter((l) => dansPeriode(l.date, mois));
  const t = totauxParType(dansMois);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11"
          onClick={() => onChangerDate(moisSuivant(mois.from, -1))}
          aria-label="Mois précédent"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <p className="font-semibold">{mois.label}</p>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11"
          onClick={() => onChangerDate(moisSuivant(mois.from, 1))}
          aria-label="Mois suivant"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      {!estCourant && (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => onChangerDate(aujourdhui)}>
            Revenir à ce mois
          </Button>
        </div>
      )}

      <Card className="p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Totaux du mois par type</caption>
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th scope="col" className="pb-2 text-left font-medium">Type</th>
              <th scope="col" className="pb-2 px-1 text-right font-medium">Heures</th>
              <th scope="col" className="pb-2 px-1 text-right font-medium">Km</th>
              <th scope="col" className="pb-2 px-1 text-right font-medium">€ HT</th>
              <th scope="col" className="pb-2 pl-1 text-right font-medium">Jours</th>
            </tr>
          </thead>
          <tbody>
            {TYPES_HEURES.map((type) => (
              <Ligne key={type} libelle={TYPE_LABELS[type]} v={t[type]} />
            ))}
            <Ligne libelle="Total" v={t.total} gras />
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-muted-foreground">
          « Jours » = dates distinctes pointées ; le total compte une seule fois un jour mixte.
        </p>
      </Card>

      <TotauxGrille titre={`Totaux ${mois.label.toLowerCase()}`} t={t.total} />
    </div>
  );
};

export default MoisTab;
