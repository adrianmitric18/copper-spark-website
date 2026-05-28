import { Award, Sparkles, FileText, Clock } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
const features = [{
  icon: Award,
  title: "Conformité RGIE",
  description: "Toutes installations passées au contrôle RGIE par organisme agréé"
}, {
  icon: Sparkles,
  title: "Travail impeccable",
  description: "Propreté extrême garantie après chaque chantier"
}, {
  icon: FileText,
  title: "Devis transparent",
  description: "Prix clairs, détaillés et sans surprise"
}, {
  icon: Clock,
  title: "Réactivité",
  description: "Intervention rapide, respect des délais"
}];
const ReassuranceSection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, {
    once: true,
    margin: "-100px"
  });
  return <section ref={sectionRef} className="py-24 md:py-32 bg-muted/30 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark opacity-50" />
      
      <div className="container mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-16">
          {features.map((feature, index) => <motion.div key={feature.title} initial={{
          opacity: 0,
          y: 50,
          scale: 0.9
        }} animate={isInView ? {
          opacity: 1,
          y: 0,
          scale: 1
        } : {
          opacity: 0,
          y: 50,
          scale: 0.9
        }} transition={{
          duration: 0.6,
          delay: index * 0.15,
          type: "spring",
          stiffness: 100
        }} whileHover={{
          y: -8,
          scale: 1.05,
          transition: {
            duration: 0.3
          }
        }} className="text-center p-6 rounded-3xl border border-border/50 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300 bg-muted">
              <motion.div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4 md:mb-6 group hover:bg-primary/20 transition-colors" whileHover={{
            scale: 1.15,
            rotate: [0, -10, 10, 0],
            transition: {
              duration: 0.5
            }
          }} animate={{
            y: [0, -5, 0]
          }} transition={{
            duration: 3,
            repeat: Infinity,
            delay: index * 0.5,
            ease: "easeInOut"
          }}>
                <feature.icon className="w-7 h-7 md:w-9 md:h-9 text-primary" />
              </motion.div>
              <h2 className="font-display text-lg md:text-xl font-bold mb-2 text-foreground">
                {feature.title}
              </h2>
              <p className="text-sm md:text-base text-foreground/85">
                {feature.description}
              </p>
            </motion.div>)}
        </div>

        {/* TVA Banner — version compacte (Sprint 3) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          <div className="flex items-center justify-center gap-3 px-5 py-3 rounded-full border border-primary/30 bg-primary/5 text-center">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-display font-bold text-sm shrink-0">
              6%
            </span>
            <p className="text-sm md:text-base text-foreground/90">
              <span className="font-semibold">TVA réduite</span> pour rénovation
              (habitation &gt; 10 ans)
            </p>
          </div>
        </motion.div>
      </div>
    </section>;
};
export default ReassuranceSection;