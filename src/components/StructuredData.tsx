import { useEffect } from "react";

interface LocalBusinessProps {
  type: "LocalBusiness";
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQPageProps {
  type: "FAQPage";
  questions: FAQItem[];
}

interface ServiceProps {
  type: "Service";
  serviceName: string;
  serviceDescription: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbProps {
  type: "BreadcrumbList";
  items: BreadcrumbItem[];
}

type StructuredDataProps = LocalBusinessProps | FAQPageProps | ServiceProps | BreadcrumbProps;

const StructuredData = (props: StructuredDataProps) => {
  useEffect(() => {
    const scriptId = `structured-data-${props.type}`;
    
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    let jsonLd: object;

    switch (props.type) {
      case "LocalBusiness":
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "Electrician",
          "name": "Le Cuivre Électrique",
          "alternateName": "Le Cuivre Electrique",
          "description": "Électricien artisan agréé basé à Court-Saint-Étienne. Installation électrique, mise en conformité RGIE, dépannage urgent 24h/24, panneaux photovoltaïques et bornes de recharge. Brabant wallon, Wallonie et Bruxelles.",
          "url": "https://cuivre-electrique.com",
          "logo": "https://cuivre-electrique.com/android-chrome-512x512.png",
          "image": "https://cuivre-electrique.com/og-image.jpg",
          "telephone": "+32485755227",
          "email": "cuivre.electrique@gmail.com",
          "vatID": "BE0805376944",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Court-Saint-Étienne",
            "addressRegion": "Brabant wallon",
            "addressCountry": "BE"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": "50.6420",
            "longitude": "4.5710"
          },
          "areaServed": [
            { "@type": "AdministrativeArea", "name": "Brabant wallon" },
            { "@type": "AdministrativeArea", "name": "Wallonie" },
            { "@type": "City", "name": "Court-Saint-Étienne" },
            { "@type": "City", "name": "Ottignies-Louvain-la-Neuve" },
            { "@type": "City", "name": "Wavre" },
            { "@type": "City", "name": "Nivelles" },
            { "@type": "City", "name": "Waterloo" },
            { "@type": "City", "name": "Genappe" },
            { "@type": "City", "name": "Rixensart" },
            { "@type": "City", "name": "Lasne" },
            { "@type": "City", "name": "Braine-l'Alleud" },
            { "@type": "City", "name": "Jodoigne" },
            { "@type": "City", "name": "Gembloux" },
            { "@type": "City", "name": "Namur" },
            { "@type": "City", "name": "Bruxelles" }
          ],
          "priceRange": "€€",
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
              "opens": "08:00",
              "closes": "18:00"
            },
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": "Saturday",
              "opens": "09:00",
              "closes": "13:00"
            }
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5",
            "reviewCount": "17",
            "bestRating": "5"
          },
          "sameAs": [
            "https://wa.me/32485755227"
          ],
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Services électriques",
            "itemListElement": [
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Installation électrique complète Bruxelles" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Mise en conformité RGIE Belgique" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Dépannage électrique urgent 24h/24" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Borne de recharge véhicule électrique" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Panneaux photovoltaïques Bruxelles Wallonie" } }
            ]
          }
        };
        break;

      case "FAQPage":
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": props.questions.map((q) => ({
            "@type": "Question",
            "name": q.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": q.answer
            }
          }))
        };
        break;

      case "Service":
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "Service",
          "serviceType": props.serviceName,
          "description": props.serviceDescription,
          "provider": {
            "@type": "Electrician",
            "name": "Le Cuivre Électrique",
            "url": "https://cuivre-electrique.com"
          },
          "areaServed": [
            { "@type": "AdministrativeArea", "name": "Brabant wallon" },
            { "@type": "AdministrativeArea", "name": "Wallonie" },
            { "@type": "City", "name": "Court-Saint-Étienne" },
            { "@type": "City", "name": "Bruxelles" }
          ]
        };
        break;

      case "BreadcrumbList":
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": props.items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
          }))
        };
        break;

      default:
        return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [props]);

  return null;
};

export default StructuredData;
