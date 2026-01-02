import { useState, useEffect } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const navItems = [
  { label: "Services", href: "#services" },
  { label: "Réalisations", href: "#realisations" },
  { label: "Devis", href: "#contact" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "glass py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between">
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-10">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-foreground/70 hover:text-primary font-medium transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA - Phone always visible */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="tel:+32485755227"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
          >
            <Phone className="w-4 h-4 group-hover:animate-pulse" />
            <span className="font-bold">0485 75 52 27</span>
          </a>
          <Button variant="copper" size="default" asChild>
            <a href="#contact">Devis gratuit</a>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-3">
          <a
            href="tel:+32485755227"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground"
          >
            <Phone className="w-5 h-5" />
          </a>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-foreground hover:text-primary transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 glass overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="container mx-auto py-6 flex flex-col gap-4">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className="text-foreground/80 hover:text-primary font-medium py-2 transition-colors"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-4 border-t border-border flex flex-col gap-3">
            <a
              href="tel:+32485755227"
              className="flex items-center gap-3 text-primary font-bold py-2"
            >
              <Phone className="w-5 h-5" />
              0485 75 52 27
            </a>
            <Button variant="copper" size="lg" className="w-full" asChild>
              <a href="#contact" onClick={handleNavClick}>Demander un devis</a>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
