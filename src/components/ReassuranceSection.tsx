import { Award, Sparkles, FileText, Clock } from "lucide-react";

const features = [
  {
    icon: Award,
    title: "Expertise certifiée",
    description: "Électriciens qualifiés aux normes belges RGIE",
  },
  {
    icon: Sparkles,
    title: "Travail impeccable",
    description: "Propreté extrême garantie après chaque chantier",
  },
  {
    icon: FileText,
    title: "Devis transparent",
    description: "Prix clairs, détaillés et sans surprise",
  },
  {
    icon: Clock,
    title: "Réactivité",
    description: "Intervention rapide, respect des délais",
  },
];

const ReassuranceSection = () => {
  return (
    <section className="py-24 md:py-32 bg-muted/30 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark opacity-50" />
      
      <div className="container mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="text-center opacity-0 animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4 md:mb-6 group hover:bg-primary/20 transition-colors">
                <feature.icon className="w-7 h-7 md:w-9 md:h-9 text-primary" />
              </div>
              <h3 className="font-display text-lg md:text-xl font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* TVA Banner */}
        <div className="max-w-4xl mx-auto opacity-0 animate-fade-up animation-delay-500">
          <div className="bento-card flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-copper flex items-center justify-center shrink-0 shadow-copper">
              <span className="font-display text-3xl md:text-4xl font-black text-primary-foreground">6%</span>
            </div>
            <div>
              <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-2">
                TVA réduite applicable
              </h3>
              <p className="text-muted-foreground text-lg">
                Bénéficiez du taux de TVA à 6% pour les travaux de rénovation dans les habitations de plus de 10 ans. 
                <span className="text-primary font-medium"> Économies garanties !</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReassuranceSection;
