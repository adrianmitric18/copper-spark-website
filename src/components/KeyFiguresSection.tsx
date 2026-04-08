import { useEffect, useRef, useState } from "react";
import { Zap, Star, Clock, Users } from "lucide-react";

const figures = [
  { icon: Zap, value: 200, suffix: "+", label: "Interventions réalisées" },
  { icon: Star, value: 17, suffix: "", label: "Avis 5 étoiles" },
  { icon: Clock, value: 4, suffix: "", label: "Ans d'expérience" },
  { icon: Users, value: 98, suffix: "%", label: "Clients satisfaits" },
];

const useCountUp = (target: number, isVisible: boolean, duration = 2000) => {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    const steps = 60;
    const increment = target / steps;
    const stepTime = duration / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      // Ease-out curve
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      current = Math.round(eased * target);
      setCount(current);
      if (step >= steps) {
        setCount(target);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isVisible, target, duration]);

  return count;
};

const FigureCard = ({ icon: Icon, value, suffix, label, isVisible, delay }: {
  icon: typeof Zap;
  value: number;
  suffix: string;
  label: string;
  isVisible: boolean;
  delay: number;
}) => {
  const count = useCountUp(value, isVisible);

  return (
    <div
      className="flex flex-col items-center text-center p-6 md:p-8 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-500"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(30px)",
        transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
      }}
    >
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <span className="text-4xl md:text-5xl font-bold text-foreground font-display tabular-nums">
        {count}{suffix}
      </span>
      <span className="text-sm text-muted-foreground mt-2">{label}</span>
    </div>
  );
};

const KeyFiguresSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-5">
            Chiffres clés
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground font-display">
            Notre expertise en chiffres
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {figures.map((fig, i) => (
            <FigureCard key={i} {...fig} isVisible={isVisible} delay={i * 150} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyFiguresSection;
