import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import LogoIcon from "@/components/LogoIcon";
import { openCookiePreferences } from "@/hooks/useCookieConsent";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border pb-20 md:pb-0">
      <div className="container mx-auto py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Logo & description */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-copper flex items-center justify-center shadow-copper">
                <LogoIcon className="w-6 h-6 text-primary-foreground" />
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
            <p className="text-muted-foreground mb-3 max-w-md leading-relaxed">
              Électricien artisan de confiance basé à <strong className="text-foreground">Court-Saint-Étienne</strong>. Intervient dans tout le Brabant wallon, en Wallonie et à Bruxelles : installation, conformité RGIE et dépannage 24h/24.
            </p>
            <p className="text-primary font-medium text-lg italic">
              "On alimente vos idées, sans court-circuiter votre journée !"
            </p>
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
                <span className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span>
                    Court-Saint-Étienne<br />
                    <span className="text-xs">Brabant wallon, Wallonie & Bruxelles</span>
                  </span>
                </span>
              </li>
              <li>
                <a
                  href="https://g.page/r/CVLZZFVq3KkiEBM/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-analytics="review_click"
                  className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  ⭐ Nous évaluer sur Google
                </a>
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
              <li>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  Gérer mes cookies
                </button>
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
              <span className="ml-2 text-foreground font-medium">Brabant wallon, Wallonie & Bruxelles</span>
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
