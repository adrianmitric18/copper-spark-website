import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from "lucide-react";
import Logo from "@/components/Logo";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo & description */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <Logo />
            </div>
            <p className="text-secondary-foreground/70 mb-6 max-w-md">
              Électricien de confiance à Bruxelles et en Wallonie. Installation,
              mise en conformité RGIE et dépannage 24h/24.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="font-display font-bold text-lg mb-4">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:+32123456789"
                  className="flex items-center gap-3 text-secondary-foreground/70 hover:text-copper-light transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  +32 123 456 789
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@lecuivreelectrique.be"
                  className="flex items-center gap-3 text-secondary-foreground/70 hover:text-copper-light transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  info@lecuivreelectrique.be
                </a>
              </li>
              <li>
                <span className="flex items-center gap-3 text-secondary-foreground/70">
                  <MapPin className="w-4 h-4" />
                  Bruxelles & Wallonie
                </span>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display font-bold text-lg mb-4">Liens rapides</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#services"
                  className="text-secondary-foreground/70 hover:text-copper-light transition-colors"
                >
                  Nos services
                </a>
              </li>
              <li>
                <a
                  href="#zone"
                  className="text-secondary-foreground/70 hover:text-copper-light transition-colors"
                >
                  Zone d'intervention
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-secondary-foreground/70 hover:text-copper-light transition-colors"
                >
                  Demander un devis
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-secondary-foreground/70 hover:text-copper-light transition-colors"
                >
                  Mentions légales
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-secondary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-secondary-foreground/60">
          <p>© {currentYear} Le Cuivre Électrique. Tous droits réservés.</p>
          <p>
            TVA: BE 0123.456.789 • Électricien agréé
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
