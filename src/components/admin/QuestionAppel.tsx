import { Check, Loader2, PhoneMissed } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuestionAppelProps {
  leadName: string;
  /** Une réponse est en cours d'enregistrement. */
  occupe?: boolean;
  /** true = « Oui » (le lead passe en traité) ; false = « Pas de réponse ». */
  onReponse: (joint: boolean) => void;
  className?: string;
}

/**
 * « Tu l'as eu ? » — posée après un appel à un lead « nouveau », et tant
 * qu'Adrian n'a pas répondu (lot statuts automatiques). Sans réponse, le lead
 * reste « nouveau » : rien ne sort de « À faire » par oubli.
 */
const QuestionAppel = ({ leadName, occupe = false, onReponse, className = "" }: QuestionAppelProps) => (
  <div
    role="group"
    aria-label={`Appel à ${leadName} : tu l'as eu ?`}
    className={`rounded-md border border-primary/40 bg-primary/5 p-2 space-y-2 ${className}`}
  >
    <p className="text-sm font-medium">Tu l'as eu ?</p>
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        size="sm"
        variant="copper"
        className="min-h-[44px] min-w-0 px-2"
        disabled={occupe}
        onClick={() => onReponse(true)}
      >
        {occupe ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Oui
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="min-h-[44px] min-w-0 px-2"
        disabled={occupe}
        onClick={() => onReponse(false)}
      >
        <PhoneMissed className="w-4 h-4" /> Pas de réponse
      </Button>
    </div>
  </div>
);

export default QuestionAppel;
