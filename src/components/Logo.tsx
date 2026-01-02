import { Zap } from "lucide-react";

const Logo = () => {
  return (
    <a href="#accueil" className="flex items-center gap-3 group">
      <div className="relative">
        <div className="w-11 h-11 rounded-xl bg-gradient-copper flex items-center justify-center shadow-copper group-hover:shadow-copper-lg transition-all duration-300">
          <Zap className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="absolute -inset-1 bg-gradient-copper rounded-xl opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300" />
      </div>
      <div className="flex flex-col">
        <span className="font-display text-lg font-bold text-foreground leading-tight tracking-tight">
          Le Cuivre
        </span>
        <span className="font-display text-sm font-semibold text-primary leading-tight">
          Électrique
        </span>
      </div>
    </a>
  );
};

export default Logo;
