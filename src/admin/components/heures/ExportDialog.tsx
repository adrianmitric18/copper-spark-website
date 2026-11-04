/**
 * Export CSV des pointages : période + chantier, puis téléchargement.
 * Format : voir construireCsv dans @/lib/admin/heures (séparateur « ; »,
 * colonnes du heures.csv de vertuoza-tools + type;forfait_eur).
 */

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  cleChantier,
  construireCsv,
  filtrerPourExport,
  moisDe,
  nomFichierCsv,
  todayIso,
  type FiltreExport,
  type Heure,
} from "@/lib/admin/heures";
import { downloadCsv } from "@/lib/admin/csv";

interface ExportDialogProps {
  lignes: Heure[];
  /** Noms de chantier proposés (du plus récent au plus ancien). */
  chantiers: string[];
}

const ExportDialog = ({ lignes, chantiers }: ExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const moisCourant = moisDe(todayIso());
  const [filtre, setFiltre] = useState<FiltreExport>({
    from: moisCourant.from,
    to: moisCourant.to,
    chantier: "",
  });

  const selection = filtrerPourExport(lignes, filtre);
  const periodeValide = /^\d{4}-\d{2}-\d{2}$/.test(filtre.from) && /^\d{4}-\d{2}-\d{2}$/.test(filtre.to) && filtre.from <= filtre.to;

  const exporter = () => {
    downloadCsv(construireCsv(selection), nomFichierCsv(filtre));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-11">
          <Download className="w-4 h-4" /> Exporter CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exporter en CSV</DialogTitle>
          <DialogDescription>
            Séparateur « ; », décimales à la virgule, lisible dans Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="export-from">Du</Label>
              <Input
                id="export-from"
                type="date"
                value={filtre.from}
                onChange={(e) => setFiltre((f) => ({ ...f, from: e.target.value }))}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="export-to">Au</Label>
              <Input
                id="export-to"
                type="date"
                value={filtre.to}
                onChange={(e) => setFiltre((f) => ({ ...f, to: e.target.value }))}
                className="h-12 text-base"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="export-chantier">Chantier</Label>
            <select
              id="export-chantier"
              value={filtre.chantier}
              onChange={(e) => setFiltre((f) => ({ ...f, chantier: e.target.value }))}
              className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Tous les chantiers</option>
              {chantiers.map((c) => (
                <option key={c} value={cleChantier(c)}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <p className="text-sm text-muted-foreground" aria-live="polite">
            {periodeValide
              ? `${selection.length} ligne${selection.length > 1 ? "s" : ""} à exporter.`
              : "La date de début doit précéder la date de fin."}
          </p>
        </div>

        <DialogFooter>
          <Button onClick={exporter} disabled={!periodeValide || selection.length === 0} className="h-12 w-full sm:w-auto">
            <Download className="w-4 h-4" /> Télécharger
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
