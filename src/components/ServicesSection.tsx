import { Zap, Shield, Lightbulb, AlertTriangle, ArrowRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface BentoCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  accent?: boolean;
  className?: string;
  index: number;
}

const BentoCard = ({ icon: Icon, title, description, features, accent, className = "", index }: BentoCardProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ 
        y: -8,
        rotateX: 5,
        rotateY: 5,
        transition: { duration: 0.3 }
      }}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
      className={`bento-card group ${accent ? 'bg-gradient-copper border-primary/50' : ''} ${className}`}
    >
      {/* Icon */}
      <motion.div 
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
          accent 
            ? 'bg-primary-foreground/20 group-hover:bg-primary-foreground/30' 
            : 'bg-primary/10 group-hover:bg-primary/20'
        }`}
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
        transition={{ duration: 0.5 }}
      >
        <Icon className={`w-7 h-7 ${accent ? 'text-primary-foreground' : 'text-primary'}`} />
      </motion.div>
      
      {/* Content */}
      <h3 className={`font-display text-2xl font-bold mb-3 ${accent ? 'text-primary-foreground' : 'text-foreground'}`}>
        {title}
      </h3>
      <p className={`mb-6 leading-relaxed ${accent ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
        {description}
      </p>
      
      {/* Features list */}
      <ul className="space-y-2 mb-6">
        {features.map((feature, i) => (
          <motion.li 
            key={i} 
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
            className={`flex items-center gap-2 text-sm ${accent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${accent ? 'bg-primary-foreground' : 'bg-primary'}`} />
            {feature}
          </motion.li>
        ))}
      </ul>

      {/* CTA */}
      <Button 
        variant={accent ? "secondary" : "copperOutline"} 
        size="sm" 
        className="group/btn"
        asChild
      >
        <a href="#contact">
          En savoir plus
          <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
        </a>
      </Button>
    </motion.div>
  );
};

const services = [
  {
    icon: AlertTriangle,
    title: "Dépannage Urgent",
    description: "Intervention rapide 24h/24 pour tous vos problèmes électriques. Précision technique et réactivité garanties.",
    features: ["Disponible 7j/7", "Délai d'intervention < 2h", "Diagnostic complet"],
    accent: true,
  },
  {
    icon: Shield,
    title: "Mise en Conformité RGIE",
    description: "Expertise complète pour mettre votre installation aux normes belges. Tableau fini et étiqueté avec soin.",
    features: ["Audit complet", "Rapport détaillé", "Attestation officielle"],
    accent: false,
  },
  {
    icon: Lightbulb,
    title: "Rénovation & LED",
    description: "Design d'éclairage moderne et installation électrique complète. Sublimez votre intérieur.",
    features: ["Éclairage LED design", "Domotique intégrée", "Solutions sur mesure"],
    accent: false,
  },
  {
    icon: Zap,
    title: "Bornes de Recharge",
    description: "Installation de bornes pour véhicules électriques. Passez à la mobilité verte en toute sérénité.",
    features: ["Toutes marques", "Installation rapide", "Conseil personnalisé"],
    accent: false,
  },
];

const ServicesSection = () => {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

  return (
    <section id="services" className="py-24 md:py-32 bg-background relative overflow-hidden">
      {/* Background accent */}
      <motion.div 
        className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2"
        animate={{ 
          x: [-50, 50, -50],
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
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
            Nos Services
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
          >
            Expertise électrique{" "}
            <span className="text-gradient-copper">haut de gamme</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg"
          >
            Des solutions professionnelles pour particuliers et entreprises, avec un souci constant de la qualité et de la propreté.
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <BentoCard
              key={service.title}
              icon={service.icon}
              title={service.title}
              description={service.description}
              features={service.features}
              accent={service.accent}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
