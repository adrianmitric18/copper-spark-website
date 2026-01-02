import { Plug, Shield, Sun, Wrench, type LucideIcon } from "lucide-react";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay: number;
}

const ServiceCard = ({ icon: Icon, title, description, delay }: ServiceCardProps) => {
  return (
    <div
      className={`group p-6 bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 opacity-0 animate-fade-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mb-5 group-hover:bg-gradient-copper group-hover:shadow-copper transition-all duration-300">
        <Icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
      </div>
      <h3 className="font-display text-xl font-bold text-foreground mb-3">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

const services = [
  {
    icon: Plug,
    title: "Installation & Rénovation",
    description:
      "Mise en place complète de votre installation électrique pour construction neuve ou rénovation. Tableaux, prises, éclairage.",
  },
  {
    icon: Shield,
    title: "Mise en conformité RGIE",
    description:
      "Remise aux normes de votre installation selon le RGIE (Règlement Général sur les Installations Électriques) belge.",
  },
  {
    icon: Sun,
    title: "Photovoltaïque & Bornes",
    description:
      "Installation de panneaux solaires et bornes de recharge pour véhicules électriques. Passez à l'énergie verte.",
  },
  {
    icon: Wrench,
    title: "Dépannage urgent",
    description:
      "Intervention rapide 24h/24 pour tous vos problèmes électriques. Court-circuit, panne, coupure de courant.",
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-accent text-accent-foreground text-sm font-medium rounded-full mb-4">
            Nos Services
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Des solutions pour tous vos{" "}
            <span className="text-gradient-copper">besoins électriques</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Particuliers ou professionnels, nous vous accompagnons dans tous vos
            projets électriques avec expertise et professionnalisme.
          </p>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <ServiceCard
              key={service.title}
              icon={service.icon}
              title={service.title}
              description={service.description}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
