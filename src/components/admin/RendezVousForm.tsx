import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, CalendarPlus } from "lucide-react";
import { TYPES_VISITE, DUREES_OPTIONS, type RendezVous } from "@/lib/rdv/constants";

export interface RdvFormValues {
  date_rdv: string;
  heure_rdv: string;
  duree_minutes: number;
  type_visite: string;
  notes_internes: string;
}

interface Props {
  initial?: Partial<RendezVous> | null;
  submitting: boolean;
  submitLabel?: string;
  onSubmit: (values: RdvFormValues) => void;
  onCancel?: () => void;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

const RendezVousForm = ({ initial, submitting, submitLabel, onSubmit, onCancel }: Props) => {
  const [date, setDate] = useState(initial?.date_rdv ?? "");
  const [heure, setHeure] = useState((initial?.heure_rdv ?? "").slice(0, 5));
  const [duree, setDuree] = useState<number>(initial?.duree_minutes ?? 60);
  const [type, setType] = useState<string>(initial?.type_visite ?? "");
  const [notes, setNotes] = useState(initial?.notes_internes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!date) e.date = "Date requise";
    else if (date < todayIso()) e.date = "La date ne peut pas être dans le passé";
    if (!heure) e.heure = "Heure requise";
    else if (heure < "07:00" || heure > "22:00") e.heure = "Entre 07h00 et 22h00";
    if (!type) e.type = "Type de visite requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      date_rdv: date,
      heure_rdv: heure,
      duree_minutes: duree,
      type_visite: type,
      notes_internes: notes.trim(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rdv-date">Date du rendez-vous *</Label>
          <Input
            id="rdv-date"
            type="date"
            value={date}
            min={todayIso()}
            onChange={(e) => setDate(e.target.value)}
          />
          {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
        </div>
        <div>
          <Label htmlFor="rdv-heure">Heure (07h00 – 22h00) *</Label>
          <Input
            id="rdv-heure"
            type="time"
            value={heure}
            min="07:00"
            max="22:00"
            step={300}
            onChange={(e) => setHeure(e.target.value)}
          />
          {errors.heure && <p className="text-xs text-destructive mt-1">{errors.heure}</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Durée estimée *</Label>
          <Select value={String(duree)} onValueChange={(v) => setDuree(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DUREES_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type de visite *</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {TYPES_VISITE.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && <p className="text-xs text-destructive mt-1">{errors.type}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="rdv-notes">Notes internes (privées, jamais envoyées au client)</Label>
        <Textarea
          id="rdv-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Code digicode, étage, particularités, matériel à prévoir..."
        />
        <p className="text-xs text-muted-foreground mt-1">{notes.length}/1000</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          variant="copper"
          size="lg"
          className="flex-1"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
          {submitLabel ?? "Confirmer le rendez-vous et envoyer les emails"}
        </Button>
        {onCancel && (
          <Button onClick={onCancel} disabled={submitting} variant="outline" size="lg">
            Annuler
          </Button>
        )}
      </div>
    </div>
  );
};

export default RendezVousForm;
