import { Link } from "react-router-dom";
import { ArrowRight, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Encart d'accès au simulateur, posé sur les pages services concernées
 * (bornes de recharge et mise en conformité RGIE). Volontairement absent de
 * la home pour l'instant.
 */
const SimulateurCTA = ({ contexte }: { contexte: "borne" | "rgie" }) => (
  <aside className="my-12 rounded-3xl border-2 border-primary/40 bg-primary/[0.05] p-6 md:p-8">
    <div className="flex flex-col md:flex-row md:items-center gap-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30">
        <Calculator className="h-6 w-6 text-primary" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-1">
          Estimez votre prix en 45 secondes
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          {contexte === "borne"
            ? "Quatre questions sur votre installation et l'emplacement de la borne, et vous obtenez une fourchette indicative."
            : "Quatre questions sur votre installation, et vous obtenez une fourchette indicative pour votre mise en conformité."}
        </p>
      </div>
      <Button variant="copper" size="lg" asChild className="shrink-0 w-full md:w-auto">
        <Link to="/simulateur">
          Lancer le simulateur
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  </aside>
);

export default SimulateurCTA;
