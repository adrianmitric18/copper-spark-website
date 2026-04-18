import { Link } from "react-router-dom";
import { Zap, Shield, Lightbulb, AlertTriangle, ArrowRight, Sun, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  href: string;
  accent?: boolean;
  index: number;
}

const ServiceCard = ({
  icon: Icon,
  title,
  description,
  features,
  href,
  accent,
  index,
}: ServiceCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 60, scale: 0.9 }}
      transition={{
        duration: 0.6,
        delay: index * 0.12,
        type: "spring",
        stiffness: 100,
      }}
      whileHover={{ y: -10, scale: 1.02, transition: { duration: 0.3 } }}
      className={`group relative p-6 md:p-8 rounded-3xl border transition-all duration-500 flex flex-col ${
        accent
          ? "bg-gradient-to-br from-primary to-primary/80 border-primary/50 shadow-lg shadow-primary/25"
          : "bg-card border-border/50 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40"
      }`}
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
          accent ? "bg-white/20 group-hover:bg-white/30" : "bg-primary/10 group-hover:bg-primary/20"
        }`}
      >
        <Icon className={`w-7 h-7 ${accent ? "text-white" : "text-primary"}`} />
      </div>

      <h3
        className={`font-display text-2xl font-bold mb-3 ${
          accent ? "text-white" : "text-card-foreground"
        }`}
      >
        {title}
      </h3>
      <p className={`mb-6 leading-relaxed ${accent ? "text-white/90" : "text-muted-foreground"}`}>
        {description}
      </p>

      <ul className="space-y-2 mb-6 flex-1">
        {features.map((feature, i) => (
          <li
            key={i}
            className={`flex items-center gap-2 text-sm ${
              accent ? "text-white/85" : "text-muted-foreground"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                accent ? "bg-white" : "bg-primary"
              }`}
            />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        variant={accent ? "secondary" : "copperOutline"}
        size="sm"
        className="group/btn"
        asChild
      >
        <Link to={href}>
          Découvrir
          <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </Button>
    </motion.div>
  );
};

const services = [
  {
    icon: AlertTriangle,
    title: "Dépannage Urgent 24h/24",
    description:
      "Intervention rapide 7j/7 pour panne, court-circuit, disjoncteur. Court-Saint-Étienne et Brabant wallon.",
    features: ["Disponible 24h/24, 7j/7", "Délai d'intervention rapide", "Diagnostic complet"],
    href: "/services/depannage-urgent",
    accent: true,
  },
  {
    icon: Zap,
    title: "Installation & Rénovation",
    description:
      "Installation électrique complète neuve ou rénovation. Tableau Schneider, appareillage Niko.",
    features: ["Schneider & Niko", "Visite technique gratuite", "Pose par Adrian en personne"],
    href: "/services/installation-electrique-renovation",
  },
  {
    icon: Shield,
    title: "Mise en Conformité RGIE",
    description:
      "Diagnostic, travaux et accompagnement jusqu'au certificat de conformité par organisme agréé.",
    features: ["Audit complet", "Coordination Vinçotte / BTV", "Certificat officiel"],
    href: "/services/mise-en-conformite-rgie",
  },
  {
    icon: Lightbulb,
    title: "Bornes de Recharge",
    description:
      "Installation de bornes Alfen et Hager pour particuliers, entreprises et copropriétés.",
    features: ["Alfen & Hager", "7,4 / 11 / 22 kW", "Pilotage app + délestage"],
    href: "/services/bornes-de-recharge",
  },
  {
    icon: Sun,
    title: "Panneaux Photovoltaïques",
    description:
      "Étude personnalisée et installation avec onduleurs Huawei ou SolarEdge. Production optimisée.",
    features: ["Huawei & SolarEdge", "Étude sur mesure", "Suivi de production"],
    href: "/services/panneaux-photovoltaiques",
  },
];

const ServicesSection = () => {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

  return (
    <section id="services" className="py-24 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />

      <div className="container mx-auto relative z-10">
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
            <span className="text-gradient-copper">en Brabant wallon & Wallonie</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg"
          >
            Basé à Court-Saint-Étienne, j'interviens dans tout le Brabant wallon, en Wallonie et à
            Bruxelles pour les particuliers et professionnels.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <ServiceCard
              key={service.title}
              icon={service.icon}
              title={service.title}
              description={service.description}
              features={service.features}
              href={service.href}
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
