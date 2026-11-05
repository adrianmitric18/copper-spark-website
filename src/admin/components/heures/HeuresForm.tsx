/**
 * Formulaire de pointage — pensé pour le téléphone : gros champs (h-14),
 * clavier numérique (inputMode), sélecteurs natifs de date et d'heure,
 * heures nettes recalculées à chaque frappe.
 *
 * Le composant est contrôlé par sa prop `initial` via une `key` côté parent :
 * changer de ligne à modifier (ou revenir en création) remonte un formulaire
 * neuf, sans synchronisation d'état fragile.
 */

import { useMemo, useState, type FormEvent } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import HeureInput from "@/components/admin/HeureInput";
import { cn } from "@/lib/utils";
import {
  TYPES_HEURES,
  TYPE_DESCRIPTIONS,
  TYPE_LABELS,
  addDays,
  calculerHeuresNettes,
  formaterDateCourte,
  formaterHeures,
  todayIso,
  type Heure,
  type HeureFormValues,
  type TypeHeure,
} from "@/lib/admin/heures";

const PAUSES_RAPIDES = [0, 15, 30, 45, 60];

const CHAMP = "h-14 text-lg px-4";

interface HeuresFormProps {
  initial: HeureFormValues;
  /** Ligne en cours de modification (null = création). */
  enEdition: Heure | null;
  /** Noms déjà saisis, du plus récent au plus ancien (suggestions + chips). */
  suggestions: string[];
  /** Km à proposer quand le chantier change (dernière ligne du même chantier). */
  kmPourChantier: (nom: string) => number | null;
  enCours: boolean;
  erreur: string | null;
  onSubmit: (valeurs: HeureFormValues) => void;
  onAnnuler: () => void;
  onSupprimer: () => void;
}

const HeuresForm = ({
  initial,
  enEdition,
  suggestions,
  kmPourChantier,
  enCours,
  erreur,
  onSubmit,
  onAnnuler,
  onSupprimer,
}: HeuresFormProps) => {
  const [v, setV] = useState<HeureFormValues>(initial);
  const [confirmerSuppression, setConfirmerSuppression] = useState(false);
  /** Vrai dès que l'utilisateur a touché le champ km : on arrête de le pré-remplir. */
  const [kmTouche, setKmTouche] = useState(initial.km !== "");
  /** Vrai si la valeur actuelle de km vient du pré-remplissage (donc effaçable). */
  const [kmAuto, setKmAuto] = useState(false);

  const set = <K extends keyof HeureFormValues>(k: K, val: HeureFormValues[K]) =>
    setV((prev) => ({ ...prev, [k]: val }));

  const choisirChantier = (nom: string) => {
    setV((prev) => {
      const next = { ...prev, chantier: nom };
      if (!kmTouche) {
        // Chantier connu → on propose ses derniers km. Nom inconnu (en cours de
        // frappe) → on n'efface que ce qu'on avait nous-mêmes pré-rempli.
        const km = kmPourChantier(nom);
        if (km !== null) {
          next.km = String(km);
          setKmAuto(true);
        } else if (kmAuto) {
          next.km = "";
          setKmAuto(false);
        }
      }
      return next;
    });
  };

  const heuresNettes = useMemo(
    () => calculerHeuresNettes(v.debut, v.fin, Number(v.pauseMin) || 0),
    [v.debut, v.fin, v.pauseMin],
  );

  const deplacement = v.type === "deplacement";
  const aujourdhui = todayIso();
  const hier = addDays(aujourdhui, -1);

  const chips = suggestions.slice(0, 6);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(v);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {enEdition && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
          <span className="font-medium text-primary">Modification d'une ligne existante</span>
          <Button type="button" variant="ghost" size="sm" onClick={onAnnuler} className="min-h-[40px]">
            <X className="w-4 h-4" /> Annuler
          </Button>
        </div>
      )}

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="heures-date" className="text-base">Date</Label>
        <div className="flex gap-2">
          <Input
            id="heures-date"
            type="date"
            value={v.date}
            onChange={(e) => set("date", e.target.value)}
            className={cn(CHAMP, "flex-1 min-w-0")}
            required
          />
          <Button
            type="button"
            variant={v.date === aujourdhui ? "default" : "outline"}
            onClick={() => set("date", aujourdhui)}
            className="h-14 px-3 text-sm"
          >
            Aujourd'hui
          </Button>
          <Button
            type="button"
            variant={v.date === hier ? "default" : "outline"}
            onClick={() => set("date", hier)}
            className="h-14 px-3 text-sm"
          >
            Hier
          </Button>
        </div>
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label className="text-base">Type</Label>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Type de pointage">
          {TYPES_HEURES.map((t: TypeHeure) => {
            const actif = v.type === t;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => set("type", t)}
                className={cn(
                  // 3 boutons sur 360 px : « DÉPLACEMENT » doit tenir sans déborder.
                  "h-16 min-w-0 px-1 rounded-lg border text-xs sm:text-sm font-bold uppercase tracking-normal sm:tracking-wide transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  actif
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/40",
                )}
              >
                {TYPE_LABELS[t]}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">{TYPE_DESCRIPTIONS[v.type]}</p>
      </div>

      {/* Chantier / client */}
      <div className="space-y-2">
        <Label htmlFor="heures-chantier" className="text-base">Chantier / client</Label>
        <Input
          id="heures-chantier"
          list="heures-chantiers-liste"
          value={v.chantier}
          onChange={(e) => choisirChantier(e.target.value)}
          placeholder="Ex. Wemmel, Catinus…"
          autoComplete="off"
          autoCapitalize="words"
          className={CHAMP}
          required
        />
        <datalist id="heures-chantiers-liste">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        {chips.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
            {chips.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => choisirChantier(s)}
                className={cn(
                  "shrink-0 h-10 px-3 rounded-full border text-sm transition-colors",
                  v.chantier.trim().toLowerCase() === s.toLowerCase()
                    ? "bg-primary/15 border-primary text-primary"
                    : "bg-background border-border hover:border-primary/40",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Début / fin */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="heures-debut" className="text-base">
            Début{deplacement && <span className="text-muted-foreground font-normal"> (facultatif)</span>}
          </Label>
          <HeureInput
            id="heures-debut"
            value={v.debut}
            onChange={(e) => set("debut", e.target.value)}
            className={CHAMP}
            required={!deplacement}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="heures-fin" className="text-base">
            Fin{deplacement && <span className="text-muted-foreground font-normal"> (facultatif)</span>}
          </Label>
          <HeureInput
            id="heures-fin"
            value={v.fin}
            onChange={(e) => set("fin", e.target.value)}
            className={CHAMP}
            required={!deplacement}
          />
        </div>
      </div>

      {/* Pause + heures nettes */}
      <div className="space-y-2">
        <Label htmlFor="heures-pause" className="text-base">Pause (minutes)</Label>
        <div className="flex gap-2 items-stretch">
          <div className="flex gap-1 flex-1 overflow-x-auto scrollbar-thin">
            {PAUSES_RAPIDES.map((p) => {
              const actif = Number(v.pauseMin) === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("pauseMin", String(p))}
                  className={cn(
                    "shrink-0 h-12 min-w-[44px] px-1.5 rounded-md border text-sm font-medium transition-colors",
                    actif
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/40",
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <Input
            id="heures-pause"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={v.pauseMin}
            onChange={(e) => set("pauseMin", e.target.value.replace(/[^0-9]/g, ""))}
            className="h-12 w-20 text-lg text-center"
            aria-label="Pause en minutes"
          />
        </div>
        <div
          className={cn(
            "rounded-lg px-4 py-3 flex items-baseline justify-between",
            heuresNettes !== null ? "bg-primary/10" : "bg-muted/50",
          )}
          aria-live="polite"
        >
          <span className="text-sm text-muted-foreground">Heures nettes</span>
          <span className="text-2xl font-display font-bold tabular-nums">
            {heuresNettes !== null ? formaterHeures(heuresNettes) : deplacement ? "—" : "0 h 00"}
          </span>
        </div>
      </div>

      {/* Km */}
      <div className="space-y-2">
        <Label htmlFor="heures-km" className="text-base">
          Km aller-retour <span className="text-muted-foreground font-normal">(facultatif)</span>
        </Label>
        <Input
          id="heures-km"
          type="text"
          inputMode="decimal"
          value={v.km}
          onChange={(e) => {
            setKmTouche(true);
            set("km", e.target.value.replace(/[^0-9.,]/g, ""));
          }}
          placeholder="Ex. 40"
          className={CHAMP}
        />
      </div>

      {/* Forfait (type FORFAIT seulement) */}
      {v.type === "forfait" && (
        <div className="space-y-2">
          <Label htmlFor="heures-forfait" className="text-base">
            Forfait € HT <span className="text-muted-foreground font-normal">(facultatif)</span>
          </Label>
          <Input
            id="heures-forfait"
            type="text"
            inputMode="decimal"
            value={v.forfaitEur}
            onChange={(e) => set("forfaitEur", e.target.value.replace(/[^0-9.,]/g, ""))}
            placeholder="Ex. 450"
            className={CHAMP}
          />
        </div>
      )}

      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="heures-note" className="text-base">
          Note <span className="text-muted-foreground font-normal">(facultatif)</span>
        </Label>
        <Textarea
          id="heures-note"
          value={v.note}
          onChange={(e) => set("note", e.target.value)}
          rows={2}
          maxLength={1000}
          className="text-base"
          placeholder="Ex. tirage câbles cuisine, attente livraison…"
        />
      </div>

      {erreur && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erreur}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={enCours} className="h-14 flex-1 text-base font-semibold">
          {enCours && <Loader2 className="w-4 h-4 animate-spin" />}
          {enEdition ? "Mettre à jour" : "Enregistrer"}
        </Button>
        {enEdition && (
          <Button
            type="button"
            variant="outline"
            disabled={enCours}
            onClick={() => setConfirmerSuppression(true)}
            className="h-14 px-4 text-destructive border-destructive/40 hover:bg-destructive/10"
            aria-label="Supprimer cette ligne"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        )}
      </div>

      <AlertDialog open={confirmerSuppression} onOpenChange={setConfirmerSuppression}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette ligne ?</AlertDialogTitle>
            <AlertDialogDescription>
              {enEdition
                ? `${formaterDateCourte(enEdition.date)} · ${enEdition.chantier} · ${formaterHeures(Number(enEdition.heures_nettes) || 0)}. Cette action est définitive.`
                : "Cette action est définitive."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Garder</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setConfirmerSuppression(false);
                onSupprimer();
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
};

export default HeuresForm;
