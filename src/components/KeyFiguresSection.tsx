import { useEffect, useRef, useState } from "react";
import { useDisplayRating } from "@/hooks/useDisplayRating";

/**
 * Section "Chiffres clés" — refonte sobre brief 2026-05-01.
 *
 * Stats vraies, pas d'icônes criardes :
 *   - Réponse en 24h (devis 48h après visite)
 *   - Note Google dynamique (useDisplayRating : Google manuel puis fallback testimonials)
 *   (le chiffre "20+ Chantiers" a été retiré le 2026-06-05 pour alléger la home)
 *
 * Aucune statistique inventée (pas de "98% satisfaits", pas de "4 ans
 * d'expérience"). Les chiffres en gros suffisent à porter la confiance.
 */
const useCountUp = (target: number, isVisible: boolean, decimals = 0, duration = 1600) => {
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isVisible, target, duration]);

  return decimals > 0
    ? value.toFixed(decimals).replace(".", ",")
    : Math.round(value).toString();
};

interface FigureProps {
  value: string;
  suffix?: string;
  label: string;
  description: string;
  isVisible: boolean;
  delay: number;
}

const Figure = ({ value, suffix, label, description, isVisible, delay }: FigureProps) => (
  <div
    className="text-center md:text-left"
    style={{
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "translateY(0)" : "translateY(20px)",
      transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
    }}
  >
    <div className="font-display font-bold text-foreground leading-none tabular-nums">
      <span className="text-5xl md:text-6xl">{value}</span>
      {suffix && (
        <span className="text-3xl md:text-4xl text-primary ml-0.5">{suffix}</span>
      )}
    </div>
    <p className="font-display text-base md:text-lg font-semibold text-foreground mt-3">
      {label}
    </p>
    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
      {description}
    </p>
  </div>
);

const KeyFiguresSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  // Source unique d'affichage : Google (manuel) puis fallback testimonials.
  const { data: rating } = useDisplayRating();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.3 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Compteurs animés. Note Google fallback à 4.94 si la fetch n'est pas
  // encore arrivée — la valeur réelle Supabase écrase dès que dispo.
  // 2026-06-05 — Chiffre "20+ Chantiers" retiré du barème (allègement home).
  // const chantiersCount = useCountUp(20, isVisible);
  const ratingValue = rating?.ratingValue ?? 4.94;
  const reviewCount = rating?.reviewCount ?? 16;
  const ratingAnimated = useCountUp(ratingValue, isVisible, 2);

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 lg:gap-12 max-w-3xl mx-auto">
          {/* 2026-06-05 — Chiffre "20+ Chantiers" retiré (allègement home).
          <Figure
            value={chantiersCount}
            suffix="+"
            label="Chantiers"
            description="Bornes, photovoltaïque, rénovations électriques en Brabant wallon."
            isVisible={isVisible}
            delay={0}
          /> */}
          <Figure
            value="24"
            suffix="h"
            label="Réponse"
            description="Devis détaillé en 48h après visite sur place."
            isVisible={isVisible}
            delay={0}
          />
          <Figure
            value={ratingAnimated}
            suffix="/5"
            label="Note Google"
            description={`Sur ${reviewCount}+ avis Google vérifiés.`}
            isVisible={isVisible}
            delay={120}
          />
        </div>
      </div>
    </section>
  );
};

export default KeyFiguresSection;
