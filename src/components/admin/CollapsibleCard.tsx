import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Carte repliable réutilisable (Phase 1.3) — pour alléger la fiche lead.
 * En-tête toujours visible (titre + chevron), contenu masquable. Permet à un
 * électricien pressé de ne voir que l'essentiel et de déplier au besoin.
 *
 * Volontairement présentationnel : le contenu (`children`) est inchangé, on ne
 * fait que l'envelopper dans un Collapsible.
 */
interface CollapsibleCardProps {
  title: ReactNode;
  /** Ouverte au premier rendu ? Par défaut fermée (réduit le scroll). */
  defaultOpen?: boolean;
  /** Classes additionnelles sur la Card (ex. bordures de couleur). */
  className?: string;
  /** Titre en rouge pour la zone dangereuse, etc. */
  titleClassName?: string;
  children: ReactNode;
}

const CollapsibleCard = ({
  title,
  defaultOpen = false,
  className,
  titleClassName,
  children,
}: CollapsibleCardProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full p-4 sm:p-6 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors min-h-[56px]"
          >
            <h2 className={cn("flex-1 font-semibold text-lg", titleClassName)}>
              {title}
            </h2>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-muted-foreground shrink-0 transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 sm:px-6 pb-6 pt-0 space-y-3">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default CollapsibleCard;
