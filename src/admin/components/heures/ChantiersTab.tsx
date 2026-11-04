/**
 * Onglet « Chantiers » : une carte par chantier avec jours, heures et km
 * cumulés, plus la colonne « heures prévues » saisie à la main (estimation
 * du devis) → réalisé / prévu en %, en rouge si dépassé.
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { decimalFr, formaterDateCourte, formaterHeures, type ChantierResume } from "@/lib/admin/heures";
import { cn } from "@/lib/utils";

interface ChantiersTabProps {
  resumes: ChantierResume[];
  onHeuresPrevues: (r: ChantierResume, heures: number | null) => void;
  enregistrementCle: string | null;
}

const ChantiersTab = ({ resumes, onHeuresPrevues, enregistrementCle }: ChantiersTabProps) => {
  if (resumes.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        Aucun chantier pour l'instant : la première saisie en crée un.
      </Card>
    );
  }

  return (
    <ul className="space-y-2">
      {resumes.map((r) => (
        <li key={r.cle}>
          <ChantierCarte r={r} onHeuresPrevues={onHeuresPrevues} enCours={enregistrementCle === r.cle} />
        </li>
      ))}
    </ul>
  );
};

interface ChantierCarteProps {
  r: ChantierResume;
  onHeuresPrevues: (r: ChantierResume, heures: number | null) => void;
  enCours: boolean;
}

const ChantierCarte = ({ r, onHeuresPrevues, enCours }: ChantierCarteProps) => {
  const [brouillon, setBrouillon] = useState(r.heuresPrevues === null ? "" : String(r.heuresPrevues));

  const valider = () => {
    const t = brouillon.trim().replace(",", ".");
    if (t === "") {
      if (r.heuresPrevues !== null) onHeuresPrevues(r, null);
      return;
    }
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0) {
      setBrouillon(r.heuresPrevues === null ? "" : String(r.heuresPrevues));
      return;
    }
    const arrondi = Math.round(n * 100) / 100;
    if (arrondi !== r.heuresPrevues) onHeuresPrevues(r, arrondi);
  };

  const pct = r.pourcentage;
  const barre = pct === null ? 0 : Math.min(100, pct);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{r.nom}</p>
          <p className="text-xs text-muted-foreground">
            {r.derniereDate ? `Dernier pointage ${formaterDateCourte(r.derniereDate)}` : "Aucun pointage"}
          </p>
        </div>
        {pct !== null && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-sm font-bold tabular-nums",
              r.depasse ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary",
            )}
            aria-label={`Réalisé ${pct} % du prévu`}
          >
            {pct} %
          </span>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-muted/50 py-2">
          <dt className="text-[11px] text-muted-foreground">Jours</dt>
          <dd className="font-display font-bold tabular-nums">{r.jours}</dd>
        </div>
        <div className="rounded-md bg-muted/50 py-2">
          <dt className="text-[11px] text-muted-foreground">Heures</dt>
          <dd className="font-display font-bold tabular-nums">{formaterHeures(r.heures)}</dd>
        </div>
        <div className="rounded-md bg-muted/50 py-2">
          <dt className="text-[11px] text-muted-foreground">Km</dt>
          <dd className="font-display font-bold tabular-nums">
            {Number.isInteger(r.km) ? r.km : decimalFr(r.km, 1)}
          </dd>
        </div>
      </dl>

      <div className="flex items-center gap-3">
        <label htmlFor={`prevu-${r.cle}`} className="text-sm text-muted-foreground shrink-0">
          Heures prévues
        </label>
        <Input
          id={`prevu-${r.cle}`}
          type="text"
          inputMode="decimal"
          value={brouillon}
          disabled={enCours}
          onChange={(e) => setBrouillon(e.target.value.replace(/[^0-9.,]/g, ""))}
          onBlur={valider}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="Devis"
          className="h-11 w-24 text-base text-center tabular-nums"
        />
        {pct !== null && (
          <span className={cn("text-sm tabular-nums", r.depasse ? "text-destructive font-semibold" : "text-muted-foreground")}>
            {decimalFr(r.heures)} / {decimalFr(r.heuresPrevues ?? 0)} h
          </span>
        )}
      </div>

      {pct !== null && (
        <div className="h-2 rounded-full bg-muted overflow-hidden" aria-hidden="true">
          <div
            className={cn("h-full rounded-full transition-all", r.depasse ? "bg-destructive" : "bg-primary")}
            style={{ width: `${barre}%` }}
          />
        </div>
      )}
    </Card>
  );
};

export default ChantiersTab;
