import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Logo & description */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-copper flex items-center justify-center shadow-copper">
                <Zap className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-lg font-bold text-foreground leading-tight">
                  Le Cuivre
                </span>
                <span className="font-display text-sm font-semibold text-primary leading-tight">
                  Électrique
                </span>
              </div>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
              Électricien artisan de confiance à Bruxelles et en Wallonie. Installation, mise en conformité RGIE et dépannage 24h/24.
            </p>
            <p className="text-primary font-medium text-lg italic">
              "On alimente vos idées, sans court-circuiter votre journée !"
            </p>
            
            {/* Social links - À venir */}
            {/* 
            <div className="flex items-center gap-3 mt-6">
              <a href="#" className="w-11 h-11 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-300" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-11 h-11 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-300" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
            */}
          </div>

          {/* Contact info */}
          <div>
            <h4 className="font-display font-bold text-lg text-foreground mb-6">Contact</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="tel:+32485755227"
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-5 h-5 text-primary" />
                  0485 75 52 27
                </a>
              </li>
              <li>
                <a
                  href="mailto:cuivre.electrique@gmail.com"
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-5 h-5 text-primary" />
                  cuivre.electrique@gmail.com
                </a>
              </li>
              <li>
                <span className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="w-5 h-5 text-primary" />
                  Bruxelles & Wallonie
                </span>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display font-bold text-lg text-foreground mb-6">Liens rapides</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/services"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Nos services
                </Link>
              </li>
              <li>
                <Link
                  to="/realisations"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Réalisations
                </Link>
              </li>
              <li>
                <Link
                  to="/avis"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Avis clients
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Demander un devis
                </Link>
              </li>
              <li>
                <Link
                  to="/mentions-legales"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Infos entreprise */}
        <div className="mt-12 p-6 bg-muted/30 border border-border/50 rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">N° TVA :</span>
              <span className="ml-2 text-foreground font-medium">BE 0805.376.944</span>
            </div>
            <div>
              <span className="text-muted-foreground">N° BCE :</span>
              <span className="ml-2 text-foreground font-medium">0805.376.944</span>
            </div>
            <div>
              <span className="text-muted-foreground">Agréé :</span>
              <span className="ml-2 text-foreground font-medium">Électricien certifié</span>
            </div>
            <div>
              <span className="text-muted-foreground">Zone :</span>
              <span className="ml-2 text-foreground font-medium">Bruxelles & Wallonie</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} Le Cuivre Électrique. Tous droits réservés.</p>
          <p>
            Électricien agréé en Belgique • Conforme RGIE
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
