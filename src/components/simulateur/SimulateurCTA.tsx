import { Link } from "react-router-dom";
import { ArrowRight, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NB_QUESTIONS } from "@/lib/simulateur/config";

/**
 * Encart d'accès au simulateur, posé sur les pages services concernées
 * (bornes de recharge et mise en conformité RGIE). Volontairement absent de
 * la home pour l'instant.
 *
 * Le lien porte `?besoin=…` : depuis une page service, le visiteur a déjà dit
 * ce qu'il cherchait, lui reposer la question serait une étape pour rien. Le
 * décompte de questions annoncé ici vient de `NB_QUESTIONS`, dérivé des
 * parcours eux-mêmes : il ne peut pas se désaligner du parcours réel.
 */
const SimulateurCTA = ({ contexte }: { contexte: "borne" | "rgie" }) => (
  <aside className="my-12 rounded-3xl border-2 border-primary/40 bg-primary/[0.05] p-6 md:p-8">
    <div className="flex flex-col md:flex-row md:items-center gap-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30">
        <Calculator className="h-6 w-6 text-primary" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-1">
          {contexte === "borne"
            ? "Estimez le prix de votre borne en moins d'une minute"
            : "Estimez le prix de votre mise en conformité en moins d'une minute"}
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          {contexte === "borne"
            ? `${NB_QUESTIONS.borne} questions sur votre installation et l'emplacement de la borne, et vous obtenez un devis indicatif détaillé poste par poste.`
            : `${NB_QUESTIONS.rgie} questions sur votre installation et le motif du contrôle, et vous obtenez un devis indicatif détaillé pour votre mise en conformité.`}
        </p>
      </div>
      <Button variant="copper" size="lg" asChild className="shrink-0 w-full md:w-auto">
        <Link to={`/simulateur?besoin=${contexte}`}>
          Lancer le simulateur
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  </aside>
);

export default SimulateurCTA;
