import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import StructuredData from "./StructuredData";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  const baseUrl = "https://cuivre-electrique.com";
  
  // Prepare structured data breadcrumbs with full URLs
  const structuredBreadcrumbs = [
    { name: "Accueil", url: baseUrl },
    ...items.map(item => ({ name: item.label, url: `${baseUrl}${item.href}` }))
  ];

  return (
    <>
      <StructuredData type="BreadcrumbList" items={structuredBreadcrumbs} />
      <nav aria-label="Fil d'Ariane" className="py-4">
        <ol className="flex items-center flex-wrap gap-1 text-sm text-muted-foreground">
          <li className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center hover:text-primary transition-colors"
              aria-label="Accueil"
            >
              <Home className="w-4 h-4" />
              <span className="sr-only">Accueil</span>
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={item.href} className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground/50" />
              {index === items.length - 1 ? (
                <span className="text-foreground font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link 
                  to={item.href} 
                  className="hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumbs;
