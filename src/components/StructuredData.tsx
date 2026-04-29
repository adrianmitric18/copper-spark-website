import { useEffect } from "react";

interface LocalBusinessProps {
  type: "LocalBusiness";
  /**
   * Aggregate rating dynamique calculé depuis Supabase.
   * Si non fourni, le bloc aggregateRating n'est PAS émis dans le JSON-LD
   * (évite les valeurs hardcodées désynchronisées de la BDD).
   */
  aggregateRating?: {
    ratingValue: number | string;
    reviewCount: number;
  };
}

interface LocalBusinessZoneProps {
  type: "LocalBusinessZone";
  areaServed: string;
  pageUrl: string;
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

interface ProjectArticleProps {
  type: "ProjectArticle";
  /** URL canonique du chantier. */
  url: string;
  headline: string;
  description: string;
  /** URL absolue de l'image principale. */
  image: string;
  /** Date du chantier (format ISO YYYY-MM-DD). */
  datePublished: string;
  /** Lieu du chantier (ville). */
  locationName: string;
  /** Tags utilisés comme keywords. */
  tags: string[];
}

type StructuredDataProps = LocalBusinessProps | LocalBusinessZoneProps | FAQPageProps | ServiceProps | BreadcrumbProps | ProjectArticleProps;

const StructuredData = (props: StructuredDataProps) => {
  useEffect(() => {
    const scriptId = `structured-data-${props.type}${
      props.type === "LocalBusinessZone" ? `-${props.areaServed}` : ""
    }${props.type === "ProjectArticle" ? `-${encodeURIComponent(props.url)}` : ""}`;
    
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    let jsonLd: object;

    switch (props.type) {
      case "LocalBusiness": {
        const localBusiness: Record<string, unknown> = {
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

        if (props.aggregateRating && props.aggregateRating.reviewCount > 0) {
          localBusiness["aggregateRating"] = {
            "@type": "AggregateRating",
            "ratingValue": String(props.aggregateRating.ratingValue),
            "reviewCount": String(props.aggregateRating.reviewCount),
            "bestRating": "5",
            "worstRating": "1"
          };
        }

        jsonLd = localBusiness;
        break;
      }

      case "LocalBusinessZone":
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Le Cuivre Électrique",
          "description": `Électricien agréé intervenant à ${props.areaServed} et dans tout le Brabant wallon.`,
          "url": props.pageUrl,
          "telephone": "+32485755227",
          "email": "cuivre.electrique@gmail.com",
          "image": "https://cuivre-electrique.com/og-image.jpg",
          "priceRange": "€€",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Court-Saint-Étienne",
            "addressRegion": "Brabant wallon",
            "addressCountry": "BE"
          },
          "areaServed": {
            "@type": "City",
            "name": props.areaServed
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

      case "ProjectArticle":
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": props.headline,
          "description": props.description,
          "image": props.image,
          "datePublished": props.datePublished,
          "url": props.url,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": props.url
          },
          "author": {
            "@type": "Organization",
            "name": "Le Cuivre Électrique",
            "url": "https://cuivre-electrique.com"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Le Cuivre Électrique",
            "logo": {
              "@type": "ImageObject",
              "url": "https://cuivre-electrique.com/android-chrome-512x512.png"
            }
          },
          "contentLocation": {
            "@type": "Place",
            "name": props.locationName
          },
          "keywords": props.tags.join(", ")
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
