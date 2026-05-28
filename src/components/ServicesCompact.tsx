import { Link } from "react-router-dom";
import { Zap, Shield, Lightbulb, AlertTriangle, Sun, ArrowRight } from "lucide-react";

const services = [
  {
    icon: AlertTriangle,
    title: "Dépannage 24h/24",
    href: "/services/depannage-urgent",
  },
  {
    icon: Zap,
    title: "Installation & Rénovation",
    href: "/services/installation-electrique-renovation",
  },
  {
    icon: Shield,
    title: "Conformité RGIE",
    href: "/services/mise-en-conformite-rgie",
  },
  {
    icon: Lightbulb,
    title: "Bornes de Recharge",
    href: "/services/bornes-de-recharge",
  },
  {
    icon: Sun,
    title: "Photovoltaïque",
    href: "/services/panneaux-photovoltaiques",
  },
];

const ServicesCompact = () => {
  return (
    <section id="services" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Mes <span className="text-gradient-copper">services</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Installation, dépannage et mise en conformité — Brabant wallon &amp; Wallonie.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 max-w-5xl mx-auto">
          {services.map(({ icon: Icon, title, href }) => (
            <Link
              key={href}
              to={href}
              className="group flex flex-col items-center justify-center gap-3 p-5 md:p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 transition-all text-center"
            >
              <span className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="w-6 h-6 text-primary" />
              </span>
              <span className="text-sm md:text-base font-medium text-card-foreground leading-tight">
                {title}
              </span>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/services"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
          >
            Voir tous les services
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesCompact;
