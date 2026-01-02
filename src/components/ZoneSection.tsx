import { MapPin, Check } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const zones = [
  {
    region: "Bruxelles",
    areas: ["Bruxelles-Capitale", "19 communes"],
    highlight: true,
  },
  {
    region: "Brabant Wallon",
    areas: ["Wavre", "Nivelles", "Ottignies-LLN", "Braine-l'Alleud"],
  },
  {
    region: "Hainaut",
    areas: ["Charleroi", "Mons", "La Louvière", "Tournai"],
  },
  {
    region: "Namur",
    areas: ["Namur", "Dinant", "Gembloux", "Sambreville"],
  },
  {
    region: "Liège",
    areas: ["Liège", "Verviers", "Seraing", "Herstal"],
  },
  {
    region: "Luxembourg",
    areas: ["Arlon", "Bastogne", "Marche-en-Famenne"],
  },
];

const ZoneSection = () => {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

  return (
    <section id="zone" className="py-24 md:py-32 bg-card relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}
      />
      
      <div className="container mx-auto relative z-10">
        {/* Section header */}
        <div ref={headerRef} className="text-center mb-16 md:mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-sm font-medium rounded-full mb-6"
          >
            Zone d'Intervention
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
          >
            Toute la{" "}
            <span className="text-gradient-copper">Belgique francophone</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg"
          >
            De Bruxelles au Luxembourg, nos électriciens se déplacent rapidement chez vous.
          </motion.p>
        </div>

        {/* Zones grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {zones.map((zone, index) => (
            <ZoneCard key={zone.region} zone={zone} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

interface ZoneCardProps {
  zone: typeof zones[0];
  index: number;
}

const ZoneCard = ({ zone, index }: ZoneCardProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ 
        y: -5,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={`bento-card ${
        zone.highlight ? '!bg-gradient-copper border-primary/50' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <motion.div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            zone.highlight ? 'bg-primary-foreground/20' : 'bg-primary/10'
          }`}
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          <MapPin
            className={`w-6 h-6 ${
              zone.highlight ? 'text-primary-foreground' : 'text-primary'
            }`}
          />
        </motion.div>
        <div>
          <h3
            className={`font-display text-xl font-bold mb-3 ${
              zone.highlight ? 'text-primary-foreground' : 'text-foreground'
            }`}
          >
            {zone.region}
          </h3>
          <ul className="space-y-1.5">
            {zone.areas.map((area, i) => (
              <motion.li
                key={area}
                initial={{ opacity: 0, x: -10 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                className={`flex items-center gap-2 text-sm ${
                  zone.highlight
                    ? 'text-primary-foreground/80'
                    : 'text-muted-foreground'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                {area}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default ZoneSection;
