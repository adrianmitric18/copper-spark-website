import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Hammer, Clock, Users, Zap } from "lucide-react";

interface CounterItemProps {
  icon: React.ElementType;
  end: number;
  suffix: string;
  prefix?: string;
  label: string;
  index: number;
  isInView: boolean;
}

const CounterItem = ({ icon: Icon, end, suffix, prefix = "", label, index, isInView }: CounterItemProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const duration = 2000;
    const stepTime = 16;
    const totalSteps = duration / stepTime;
    const increment = end / totalSteps;
    const delay = index * 200;

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(interval);
        } else {
          setCount(Math.floor(start));
        }
      }, stepTime);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [isInView, end, index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay: index * 0.15, type: "spring", stiffness: 100 }}
      className="text-center group"
    >
      <motion.div
        className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors"
        whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
        transition={{ duration: 0.4 }}
      >
        <Icon className="w-7 h-7 md:w-9 md:h-9 text-primary" />
      </motion.div>

      <div className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-gradient-copper mb-2">
        {prefix}{count}{suffix}
      </div>

      <p className="text-muted-foreground text-sm md:text-base font-medium">{label}</p>
    </motion.div>
  );
};

const counters = [
  { icon: Hammer, end: 500, suffix: "+", prefix: "", label: "Chantiers réalisés" },
  { icon: Clock, end: 15, suffix: " ans", prefix: "", label: "D'expérience" },
  { icon: Users, end: 98, suffix: "%", prefix: "", label: "Clients satisfaits" },
  { icon: Zap, end: 24, suffix: "h", prefix: "<", label: "Délai d'intervention" },
];

const CounterSection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/8 rounded-full blur-[120px]" />

      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-sm font-medium rounded-full mb-6">
            Nos Chiffres
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            La confiance en <span className="text-gradient-copper">chiffres</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {counters.map((counter, index) => (
            <CounterItem
              key={counter.label}
              icon={counter.icon}
              end={counter.end}
              suffix={counter.suffix}
              prefix={counter.prefix}
              label={counter.label}
              index={index}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CounterSection;
