import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { SERVICES_LINKS } from "@/lib/seo-links";

/**
 * Section "Nos services" de la home — 2026-08-09.
 *
 * Remplace l'ancienne ServicesSection (grille de 5 cartes, retirée le
 * 2026-06-05 pour raison esthétique). Objectif SEO : la home concentre la
 * quasi-totalité des clics du site et doit transmettre du lien vers les 5 pages
 * services, avec une ancre descriptive.
 *
 * Parti pris visuel : liste éditoriale numérotée plutôt qu'une grille de
 * cartes — plus compact, plus sobre, cohérent avec le hero (cuivre/anthracite).
 * Colonne de gauche fixe, liste à droite ; sur mobile tout s'empile.
 *
 * Source unique des libellés et des URL : SERVICES_LINKS (@/lib/seo-links),
 * partagé avec le composant InternalLinks.
 */
const HomeServicesSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 16 },
    animate: isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 16 },
    transition: { duration: 0.5, delay: reduce ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section
      ref={sectionRef}
      id="services"
      className="relative py-20 md:py-28 bg-background overflow-hidden"
    >
      {/* Halo cuivre très discret, dans l'esprit du hero */}
      <div className="absolute top-1/3 -left-32 w-[420px] h-[420px] bg-primary/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="container mx-auto relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Colonne intro */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <motion.span
                {...fadeUp(0)}
                className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-5"
              >
                Nos services
              </motion.span>

              <motion.h2
                {...fadeUp(0.06)}
                className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-[1.15] mb-5"
              >
                Cinq métiers,{" "}
                <span className="text-gradient-copper">un seul artisan</span>
              </motion.h2>

              <motion.p
                {...fadeUp(0.12)}
                className="text-muted-foreground leading-relaxed mb-8 max-w-md"
              >
                Basé à Court-Saint-Étienne, j'interviens moi-même sur chaque chantier en Brabant
                wallon, en Wallonie et à Bruxelles. Du dépannage urgent à la borne de recharge.
              </motion.p>

              <motion.div {...fadeUp(0.18)}>
                <Link
                  to="/services"
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                >
                  Voir le détail des services
                  <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Liste des services */}
          <div className="lg:col-span-7">
            <ul className="border-t border-border/60">
              {SERVICES_LINKS.map((service, index) => (
                <motion.li
                  key={service.slug}
                  {...fadeUp(0.1 + index * 0.07)}
                  className="border-b border-border/60"
                >
                  <Link
                    to={service.href}
                    className="group grid grid-cols-[auto_1fr_auto] items-start gap-x-5 md:gap-x-7 py-6 md:py-7 px-2 -mx-2 rounded-xl transition-colors hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <span
                      aria-hidden="true"
                      className="font-display text-sm font-bold tabular-nums text-muted-foreground/60 group-hover:text-primary transition-colors pt-1"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="min-w-0">
                      <h3 className="font-display text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {service.label}
                      </h3>
                      <span className="block text-sm md:text-base text-muted-foreground leading-relaxed mt-1.5">
                        {service.description}
                      </span>
                    </span>

                    <ArrowUpRight
                      aria-hidden="true"
                      className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all mt-1.5"
                    />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeServicesSection;
