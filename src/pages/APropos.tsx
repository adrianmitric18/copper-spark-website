import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import { motion } from "framer-motion";
import { Shield, Sparkles, Handshake, Clock, Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
const values = [{
  icon: Shield,
  title: "Sécurité et normes",
  description: "La conformité RGIE et la sécurité sont ma priorité absolue sur chaque chantier."
}, {
  icon: Sparkles,
  title: "Chantier soigné",
  description: "Je laisse votre espace propre et rangé après chaque intervention."
}, {
  icon: Handshake,
  title: "Transparence",
  description: "Devis clairs et communication honnête, sans mauvaises surprises."
}, {
  icon: Clock,
  title: "Fiabilité",
  description: "Ponctualité et respect des délais annoncés."
}, {
  icon: Lightbulb,
  title: "Conseils adaptés",
  description: "Des solutions personnalisées selon vos besoins et votre budget."
}];
const APropos = () => {
  return <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO title="À propos | Le Cuivre Électrique - Adrian Mitric, Électricien" description="Découvrez Le Cuivre Électrique et Adrian Mitric, électricien indépendant à Bruxelles et en Wallonie. Valeurs, expérience et engagement qualité." keywords="électricien indépendant, Adrian Mitric, Le Cuivre Électrique, électricien Bruxelles, à propos" canonical="https://cuivre-electrique.com/a-propos" />
      <Header />
      <main className="pt-24">
        {/* Hero section */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }} />
          
          <div className="container mx-auto relative z-10">
            <div className="max-w-4xl mx-auto">
              <motion.span initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-sm font-medium rounded-full mb-6">
                À propos
              </motion.span>
              
              <motion.h1 initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.1
            }} className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-8">
                À propos de{" "}
                <span className="text-gradient-copper">Le Cuivre Électrique</span>
              </motion.h1>

              <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.2
            }} className="bg-card border border-border/50 rounded-2xl p-8 md:p-10 mb-12">
                <p className="text-lg md:text-xl text-foreground leading-relaxed mb-6">
                  Je m'appelle <strong className="text-primary">Adrian Mitric</strong>, électricien indépendant et fondateur de Le Cuivre Électrique.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Électricien de confiance, j'accompagne mes clients en rénovation et en construction neuve pour des installations électriques complètes, des mises en conformité RGIE, des dépannages soignés et des solutions en énergies vertes (photovoltaïque, bornes de recharge).
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values section */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto">
            <motion.h2 initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="font-display text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
              Mes valeurs
            </motion.h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {values.map((value, index) => <motion.div key={value.title} initial={{
              opacity: 0,
              y: 30
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1
            }} className="bg-background border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {value.description}
                  </p>
                </motion.div>)}
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto">
            <motion.div initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="max-w-3xl mx-auto text-center">
              <p className="text-xl md:text-2xl text-foreground font-medium mb-4">
                Le Cuivre Électrique, c'est une électricité fiable,
              </p>
              <p className="text-xl md:text-2xl text-primary font-bold mb-8">
                On alimente vos idées sans court-circuiter votre journée.
              </p>
              <Button asChild size="lg" className="group">
                <Link to="/contact">
                  Contactez-moi pour discuter de votre projet
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>;
};
export default APropos;