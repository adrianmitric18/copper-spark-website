/**
 * Onglet « Semaine » : les pointages de la semaine (lundi → dimanche), une
 * carte par ligne, navigation semaine précédente / suivante et totaux.
 * Un tap sur une ligne la charge dans le formulaire pour modification.
 */

import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TYPE_LABELS,
  addDays,
  dansPeriode,
  decimalFr,
  eurosTexte,
  formaterDateCourte,
  formaterHeures,
  normaliserHeure,
  semaineDe,
  todayIso,
  totaux,
  type Heure,
  type TypeHeure,
} from "@/lib/admin/heures";
import TotauxGrille from "@/admin/components/heures/TotauxGrille";

const TYPE_BADGE_CLASSES: Record<TypeHeure, string> = {
  chantier: "bg-primary/15 text-primary border-primary/30",
  forfait: "bg-green-500/15 text-green-700 border-green-500/30",
  deplacement: "bg-blue-500/15 text-blue-600 border-blue-500/30",
};

interface SemaineTabProps {
  lignes: Heure[];
  /** Une date de la semaine affichée (AAAA-MM-JJ). */
  dateRef: string;
  onChangerDate: (iso: string) => void;
  onEditer: (ligne: Heure) => void;
  enEditionId: string | null;
}

const SemaineTab = ({ lignes, dateRef, onChangerDate, onEditer, enEditionId }: SemaineTabProps) => {
  const semaine = semaineDe(dateRef);
  const aujourdhui = todayIso();
  const estCourante = dansPeriode(aujourdhui, semaine);

  const dansSemaine = lignes
    .filter((l) => dansPeriode(l.date, semaine))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.debut ?? "").localeCompare(b.debut ?? ""));

  const t = totaux(dansSemaine);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11"
          onClick={() => onChangerDate(addDays(semaine.from, -7))}
          aria-label="Semaine précédente"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-center min-w-0">
          <p className="font-semibold">{semaine.label}</p>
          <p className="text-xs text-muted-foreground">
            {formaterDateCourte(semaine.from)} → {formaterDateCourte(semaine.to)}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11"
          onClick={() => onChangerDate(addDays(semaine.from, 7))}
          aria-label="Semaine suivante"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      {!estCourante && (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => onChangerDate(aujourdhui)}>
            Revenir à cette semaine
          </Button>
        </div>
      )}

      {dansSemaine.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Aucun pointage cette semaine.
        </Card>
      ) : (
        <ul className="space-y-2">
          {dansSemaine.map((l) => {
            const type = l.type as TypeHeure;
            const debut = normaliserHeure(l.debut);
            const fin = normaliserHeure(l.fin);
            const actif = l.id === enEditionId;
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => onEditer(l)}
                  className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                  aria-label={`Modifier ${formaterDateCourte(l.date)} ${l.chantier}`}
                >
                  <Card
                    className={`p-3 min-h-[64px] transition-colors hover:border-primary/40 active:bg-muted/40 ${
                      actif ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold tabular-nums">{formaterDateCourte(l.date)}</span>
                          <Badge className={TYPE_BADGE_CLASSES[type] ?? ""}>{TYPE_LABELS[type] ?? l.type}</Badge>
                        </div>
                        <p className="font-medium truncate">{l.chantier}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {debut && fin ? `${debut}–${fin} · pause ${l.pause_min} min` : "sans horaire"}
                          {l.note ? ` · ${l.note}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display font-bold tabular-nums">
                          {formaterHeures(Number(l.heures_nettes) || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {l.km !== null && l.km !== undefined ? `${decimalFr(Number(l.km), Number.isInteger(Number(l.km)) ? 0 : 1)} km` : ""}
                          {l.forfait_eur !== null && l.forfait_eur !== undefined
                            ? `${l.km !== null ? " · " : ""}${eurosTexte(Number(l.forfait_eur))} €`
                            : ""}
                        </p>
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground inline-block mt-1" aria-hidden="true" />
                      </div>
                    </div>
                  </Card>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <TotauxGrille titre="Totaux de la semaine" t={t} />
    </div>
  );
};

export default SemaineTab;
