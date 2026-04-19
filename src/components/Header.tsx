import { useState, useEffect } from "react";
import { Menu, X, Phone, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";

const navItems = [
  { label: "Accueil", href: "/" },
  { label: "À propos", href: "/a-propos" },
  // "Services" handled separately as dropdown
  { label: "Réalisations", href: "/realisations" },
  { label: "Avis", href: "/avis" },
  { label: "FAQ & Tarifs", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

const serviceItems = [
  { label: "Installation & Rénovation", href: "/services/installation-electrique-renovation" },
  { label: "Dépannage 24h/24", href: "/services/depannage-urgent" },
  { label: "Conformité RGIE", href: "/services/mise-en-conformite-rgie" },
  { label: "Bornes de recharge", href: "/services/bornes-de-recharge" },
  { label: "Panneaux photovoltaïques", href: "/services/panneaux-photovoltaiques" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [servicesOpenMobile, setServicesOpenMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { trackEvent } = useAnalyticsEvents();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = () => {
    setIsOpen(false);
    setServicesOpenMobile(false);
  };

  const isActive = (href: string) => location.pathname === href;
  const isServicesActive = location.pathname.startsWith("/services");

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 h-20 flex items-center transition-colors duration-300 ${
        isScrolled ? "glass" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link to="/">
            <Logo />
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {/* Accueil + À propos */}
          {navItems.slice(0, 2).map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`font-medium transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 ${
                isActive(item.href)
                  ? "text-primary after:w-full"
                  : "text-foreground/70 hover:text-primary after:w-0 hover:after:w-full"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Services dropdown */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={`bg-transparent font-medium hover:bg-transparent data-[state=open]:bg-transparent focus:bg-transparent ${
                    isServicesActive
                      ? "text-primary"
                      : "text-foreground/70 hover:text-primary"
                  }`}
                >
                  Services
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[280px] gap-1 p-3 bg-card">
                    {serviceItems.map((s) => (
                      <li key={s.href}>
                        <Link
                          to={s.href}
                          className="block rounded-lg px-3 py-2 text-sm text-foreground/80 hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          {s.label}
                        </Link>
                      </li>
                    ))}
                    <li className="border-t border-border/60 mt-1 pt-1">
                      <Link
                        to="/services"
                        className="block rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                      >
                        Voir tous les services →
                      </Link>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Reste */}
          {navItems.slice(2).map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`font-medium transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 ${
                isActive(item.href)
                  ? "text-primary after:w-full"
                  : "text-foreground/70 hover:text-primary after:w-0 hover:after:w-full"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="hidden md:flex items-center gap-3"
        >
          <a
            href="tel:+32485755227"
            data-analytics="call_click"
            onClick={() => trackEvent("call_click", { source_section: "header_desktop" })}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
          >
            <Phone className="w-4 h-4 group-hover:animate-pulse" />
            <span className="font-bold">0485 75 52 27</span>
          </a>
          <Button variant="copper" size="default" asChild>
            <Link
              to="/contact"
              data-analytics="quote_request"
              onClick={() => trackEvent("quote_request", { source_section: "header_desktop" })}
            >
              Devis gratuit
            </Link>
          </Button>
        </motion.div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <a
            href="tel:+32485755227"
            data-analytics="call_click"
            onClick={() => trackEvent("call_click", { source_section: "header_mobile" })}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground"
          >
            <Phone className="w-5 h-5" />
          </a>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-full text-foreground hover:bg-primary/20 transition-colors"
            aria-label="Toggle menu"
          >
            <span className="text-sm font-medium">Menu</span>
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden absolute top-full left-0 right-0 glass overflow-hidden max-h-[80vh] overflow-y-auto"
          >
            <nav className="container mx-auto py-6 flex flex-col gap-2">
              {navItems.slice(0, 2).map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={handleNavClick}
                  className={`block font-medium py-2 transition-colors ${
                    isActive(item.href)
                      ? "text-primary"
                      : "text-foreground/80 hover:text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Services accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setServicesOpenMobile(!servicesOpenMobile)}
                  className={`flex items-center justify-between w-full py-2 font-medium transition-colors ${
                    isServicesActive ? "text-primary" : "text-foreground/80"
                  }`}
                >
                  <span>Services</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      servicesOpenMobile ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {servicesOpenMobile && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pl-4 border-l-2 border-primary/30 ml-2 mt-1 space-y-1"
                    >
                      {serviceItems.map((s) => (
                        <Link
                          key={s.href}
                          to={s.href}
                          onClick={handleNavClick}
                          className="block py-1.5 text-sm text-foreground/70 hover:text-primary"
                        >
                          {s.label}
                        </Link>
                      ))}
                      <Link
                        to="/services"
                        onClick={handleNavClick}
                        className="block py-1.5 text-sm font-semibold text-primary"
                      >
                        Voir tous les services →
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {navItems.slice(2).map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={handleNavClick}
                  className={`block font-medium py-2 transition-colors ${
                    isActive(item.href)
                      ? "text-primary"
                      : "text-foreground/80 hover:text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              <div className="pt-4 mt-2 border-t border-border flex flex-col gap-3">
                <a
                  href="tel:+32485755227"
                  data-analytics="call_click"
                  onClick={() => {
                    trackEvent("call_click", { source_section: "header_mobile_menu" });
                    handleNavClick();
                  }}
                  className="flex items-center gap-3 text-primary font-bold py-2"
                >
                  <Phone className="w-5 h-5" />
                  0485 75 52 27
                </a>
                <Button variant="copper" size="lg" className="w-full" asChild>
                  <Link
                    to="/contact"
                    onClick={() => {
                      trackEvent("quote_request", { source_section: "header_mobile_menu" });
                      handleNavClick();
                    }}
                    data-analytics="quote_request"
                  >
                    Demander un devis
                  </Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
