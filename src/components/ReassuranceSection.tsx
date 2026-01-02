import { Award, Sparkles, FileText } from "lucide-react";

const features = [
  {
    icon: Award,
    title: "Expertise certifiée",
    description:
      "Électriciens qualifiés et certifiés, formés aux dernières normes belges RGIE.",
  },
  {
    icon: Sparkles,
    title: "Travail propre et soigné",
    description:
      "Nous respectons votre espace. Chantier propre garanti après chaque intervention.",
  },
  {
    icon: FileText,
    title: "Devis transparent",
    description:
      "Prix clairs et détaillés, sans surprise. Nous vous expliquons chaque poste.",
  },
];

const ReassuranceSection = () => {
  return (
    <section id="apropos" className="py-20 md:py-28 bg-gradient-hero">
      <div className="container mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-accent text-accent-foreground text-sm font-medium rounded-full mb-4">
            Pourquoi nous choisir
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            La qualité au service de{" "}
            <span className="text-gradient-copper">votre sécurité</span>
          </h2>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`text-center p-8 opacity-0 animate-fade-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-copper shadow-copper flex items-center justify-center mx-auto mb-6">
                <feature.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* TVA Banner */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-primary/20">
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center shrink-0">
                <span className="font-display text-2xl font-bold text-primary">6%</span>
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground mb-1">
                  TVA réduite applicable
                </h3>
                <p className="text-muted-foreground">
                  Bénéficiez du taux de TVA à 6% pour les travaux de rénovation dans
                  les habitations de plus de 10 ans. Économies garanties !
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReassuranceSection;
