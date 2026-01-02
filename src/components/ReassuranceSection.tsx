import { Award, Sparkles, FileText, Clock } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

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
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-muted/30 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark opacity-50" />
      
      <div className="container mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.15,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                y: -8,
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
              className="text-center p-6 rounded-3xl bg-card border border-border/50 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300"
            >
              <motion.div 
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4 md:mb-6 group hover:bg-primary/20 transition-colors"
                whileHover={{ 
                  scale: 1.15,
                  rotate: [0, -10, 10, 0],
                  transition: { duration: 0.5 }
                }}
                animate={{ 
                  y: [0, -5, 0],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  delay: index * 0.5,
                  ease: "easeInOut"
                }}
              >
                <feature.icon className="w-7 h-7 md:w-9 md:h-9 text-primary" />
              </motion.div>
              <h3 className="font-display text-lg md:text-xl font-bold text-card-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm md:text-base">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* TVA Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <motion.div 
            className="p-8 rounded-3xl bg-card border border-border/50 shadow-xl shadow-black/10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left"
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-lg shadow-primary/30"
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(205, 127, 50, 0.3)",
                  "0 0 40px rgba(205, 127, 50, 0.5)",
                  "0 0 20px rgba(205, 127, 50, 0.3)"
                ],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <span className="font-display text-3xl md:text-4xl font-black text-white">6%</span>
            </motion.div>
            <div>
              <h3 className="font-display text-xl md:text-2xl font-bold text-card-foreground mb-2">
                TVA réduite applicable
              </h3>
              <p className="text-muted-foreground text-lg">
                Bénéficiez du taux de TVA à 6% pour les travaux de rénovation dans les habitations de plus de 10 ans. 
                <span className="text-primary font-medium"> Économies garanties !</span>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ReassuranceSection;
