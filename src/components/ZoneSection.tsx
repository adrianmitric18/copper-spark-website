import { MapPin, Check } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const priorityCities = [
  "Court-Saint-Étienne",
  "Ottignies-Louvain-la-Neuve",
  "Wavre",
  "Nivelles",
  "Waterloo",
  "Genappe",
  "Rixensart",
  "Lasne",
  "Braine-l'Alleud",
  "Jodoigne",
  "Gembloux",
  "Namur",
];

const ZoneSection = () => {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

  return (
    <section id="zone" className="py-24 md:py-32 bg-card relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
        }}
      />

      <div className="container mx-auto relative z-10">
        <div ref={headerRef} className="text-center mb-12 md:mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-sm font-medium rounded-full mb-6"
          >
            Zone d'intervention
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
          >
            Basé en{" "}
            <span className="text-gradient-copper">Brabant wallon</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg"
          >
            Basé à <strong className="text-foreground">Court-Saint-Étienne</strong>, j'interviens
            en priorité dans les 12 communes du Brabant wallon. Wallonie et Bruxelles sur demande.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-background border border-border/60 rounded-3xl p-6 md:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl md:text-2xl font-bold text-foreground">
                Communes prioritaires
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {priorityCities.map((city, i) => (
                <motion.div
                  key={city}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="flex items-center gap-2 px-3 py-2 bg-card border border-border/40 rounded-lg text-sm text-foreground"
                >
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  {city}
                </motion.div>
              ))}
            </div>
            <p className="text-muted-foreground text-sm mt-6 text-center">
              Vous n'êtes pas dans cette liste ? Appelez-nous : nous intervenons aussi sur le reste
              de la <strong>Wallonie</strong> et sur <strong>Bruxelles</strong> selon disponibilité.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ZoneSection;
