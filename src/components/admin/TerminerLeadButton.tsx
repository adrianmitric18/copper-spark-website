import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChangerStatutLead } from "@/admin/hooks/useChangerStatutLead";
import { TERMINER_CHOIX, type TerminalLeadStatus } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

interface TerminerLeadButtonProps {
  lead: { id: string; name: string; status: string };
  className?: string;
  /** Texte du bouton (défaut « Terminer »). */
  label?: string;
  /** Appelé une fois le statut enregistré. */
  onDone?: (status: TerminalLeadStatus) => void;
}

/**
 * Bouton « Terminer » des cartes de lead (Leads, Aujourd'hui, Calendrier) :
 * un tap ouvre Converti / Sans suite / Perdu, applicable quel que soit l'état
 * du lead (avec ou sans RDV, email, devis). Règle 4 du brief admin : tout ce
 * qui est affiché peut être fermé en un geste, depuis la liste.
 *
 * Utilisable à l'intérieur d'une carte cliquable : le clic ne navigue pas.
 */
const TerminerLeadButton = ({ lead, className, label = "Terminer", onDone }: TerminerLeadButtonProps) => {
  const changerStatut = useChangerStatutLead();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn("min-h-[40px] shrink-0", className)}
          aria-label={`Terminer le lead ${lead.name}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <CheckCircle2 className="w-4 h-4" /> {label}
        </Button>
      </DropdownMenuTrigger>
      {/* Le menu est rendu dans un portail, mais les événements React remontent
          quand même vers la carte cliquable : on les arrête ici, sinon choisir
          « Sans suite » ouvrirait aussi la fiche du lead. */}
      <DropdownMenuContent align="end" className="w-60" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>Terminer ce lead</DropdownMenuLabel>
        {TERMINER_CHOIX.map((c) => (
          <DropdownMenuItem
            key={c.value}
            className="min-h-[48px] flex-col items-start justify-center gap-0 cursor-pointer"
            onSelect={() => {
              void changerStatut(lead, c.value).then((ok) => {
                if (ok) onDone?.(c.value);
              });
            }}
          >
            <span className="font-medium">{c.label}</span>
            <span className="text-xs text-muted-foreground">{c.aide}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TerminerLeadButton;
