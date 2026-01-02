import { Zap } from "lucide-react";

const Logo = () => {
  return (
    <a href="#accueil" className="flex items-center gap-2 group">
      <div className="relative">
        <div className="w-10 h-10 rounded-lg bg-gradient-copper flex items-center justify-center shadow-copper group-hover:shadow-copper-lg transition-shadow duration-300">
          <Zap className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-display text-lg font-bold text-foreground leading-tight">
          Le Cuivre
        </span>
        <span className="font-display text-sm font-bold text-primary leading-tight">
          Électrique
        </span>
      </div>
    </a>
  );
};

export default Logo;
