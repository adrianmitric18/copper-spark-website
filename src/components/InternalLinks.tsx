import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SERVICES_LINKS, ZONES_LINKS, type SeoLink } from "@/lib/seo-links";

interface InternalLinksProps {
  mode: "services" | "zones";
  excludeSlug?: string;
  title: string;
  intro?: string;
}

const InternalLinks = ({ mode, excludeSlug, title, intro }: InternalLinksProps) => {
  const items: SeoLink[] = (mode === "services" ? SERVICES_LINKS : ZONES_LINKS).filter(
    (item) => item.slug !== excludeSlug,
  );

  if (items.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
            {title}
          </h2>
          {intro ? (
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-3xl">{intro}</p>
          ) : (
            <div className="mb-8" />
          )}
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <li key={item.slug}>
                <Link
                  to={item.href}
                  className="group block h-full p-5 bg-card border border-border/60 rounded-2xl hover:border-primary/60 hover:shadow-md transition-all"
                >
                  <span className="flex items-center justify-between gap-3 mb-2">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.label}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </span>
                  <span className="block text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default InternalLinks;
