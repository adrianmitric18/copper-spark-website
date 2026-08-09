import { Link } from "react-router-dom";
import { ArrowRight, PlugZap } from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

/**
 * Carte d'accès au simulateur, posée sur la home sous la section services.
 *
 * Fond anthracite en dégradé et halo cuivre : elle tranche volontairement avec
 * le reste de la page, qui est clair, sans pour autant devenir un pavé
 * publicitaire. Couleurs fixes plutôt que tokens de thème — le bloc doit rendre
 * pareil en clair et en sombre.
 */
const SimulateurBanner = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: reduce ? 0 : 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 20 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/10 px-6 py-8 md:px-10 md:py-9 shadow-2xl shadow-black/25"
          style={{
            background:
              "linear-gradient(135deg, #2A2A2A 0%, #1F1F1F 45%, #161616 100%)",
          }}
        >
          {/* Halo cuivre diffus, purement décoratif */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-[90px]"
            style={{ background: "rgba(232,104,48,0.30)" }}
          />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
            <span
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#E86830]/40"
              style={{ background: "rgba(232,104,48,0.14)" }}
            >
              <PlugZap className="h-7 w-7 text-[#E86830]" strokeWidth={1.75} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E86830]">
                Simulateur de prix
              </p>
              <h2 className="font-display text-xl md:text-2xl font-bold leading-snug text-white">
                Projet de borne ou de conformité ? Obtenez votre estimation
                personnalisée en 4 questions.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Résultat immédiat, sans engagement, sur nos tarifs réels en Brabant
                wallon.
              </p>
            </div>

            <Button variant="copper" size="lg" asChild className="shrink-0 w-full md:w-auto">
              <Link to="/simulateur">
                Estimer mon prix
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SimulateurBanner;
