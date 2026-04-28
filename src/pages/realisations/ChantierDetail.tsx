import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  MapPin,
  Calendar,
  Clock,
  Wallet,
  ArrowLeft,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import StructuredData from "@/components/StructuredData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProjectStory from "@/components/realisations/ProjectStory";
import BeforeAfterSlider from "@/components/realisations/BeforeAfterSlider";
import ProjectFAQ from "@/components/realisations/ProjectFAQ";
import ProjectGallery from "@/components/realisations/ProjectGallery";
import { fetchProjectBySlug } from "@/lib/chantiers/queries";
import { getChantierImageUrl } from "@/lib/chantiers/upload";

const ChantierDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-chantier", slug],
    queryFn: () => (slug ? fetchProjectBySlug(slug) : Promise.resolve(null)),
    enabled: !!slug,
    staleTime: 60_000,
  });

  // Scroll en haut au changement de slug
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title="Chantier introuvable | Le Cuivre Électrique"
          description="Ce chantier n'existe pas ou a été retiré."
          noindex
        />
        <Header />
        <main className="pt-32 pb-16 container mx-auto px-4 text-center">
          <h1 className="text-3xl font-display font-bold mb-3">
            Chantier introuvable
          </h1>
          <p className="text-muted-foreground mb-6">
            Cette réalisation n'est plus disponible.
          </p>
          <Button asChild>
            <Link to="/realisations">
              <ArrowLeft className="w-4 h-4" />
              Voir toutes les réalisations
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const { project, images, tags } = data;

  // Construction des paires avant/après par ordre d'arrivée
  const befores = images.filter((i) => i.kind === "before");
  const afters = images.filter((i) => i.kind === "after");
  const pairs = befores.slice(0, afters.length).map((b, i) => ({
    before: b,
    after: afters[i],
  }));

  const cover =
    images.find((i) => i.is_cover) ?? images.find((i) => i.kind === "photo") ?? images[0] ?? null;

  const dateStr = new Date(project.completed_at).toLocaleDateString("fr-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const canonicalUrl = `https://cuivre-electrique.com/realisations/${project.slug}`;
  const seoTitle =
    project.meta_title ?? `${project.title} – ${project.location} | Le Cuivre Électrique`;
  const seoDescription = project.meta_description ?? project.summary;
  const ogImage = cover
    ? getChantierImageUrl(cover.storage_path)
    : "https://cuivre-electrique.com/og-image.jpg";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={tags.join(", ")}
        canonical={canonicalUrl}
        ogImage={ogImage}
      />
      <StructuredData
        type="BreadcrumbList"
        items={[
          { name: "Accueil", url: "https://cuivre-electrique.com" },
          { name: "Réalisations", url: "https://cuivre-electrique.com/realisations" },
          { name: project.title, url: canonicalUrl },
        ]}
      />
      <StructuredData
        type="ProjectArticle"
        url={canonicalUrl}
        headline={project.title}
        description={project.summary}
        image={ogImage}
        datePublished={project.completed_at}
        locationName={project.location}
        tags={tags}
      />
      {project.faq && project.faq.length > 0 && (
        <StructuredData type="FAQPage" questions={project.faq} />
      )}

      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: "Réalisations", href: "/realisations" },
              { label: project.title, href: `/realisations/${project.slug}` },
            ]}
          />

          <article className="max-w-4xl mx-auto">
            {/* Hero */}
            <header className="mb-8">
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/realisations?tag=${encodeURIComponent(tag)}`}
                  >
                    <Badge variant="secondary" className="hover:bg-primary/20 cursor-pointer">
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>

              <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">
                {project.title}
              </h1>

              <p className="text-lg text-muted-foreground mb-5">
                {project.summary}
              </p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground border-t border-b border-border py-3">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  {project.location} <span className="text-muted-foreground/60">·</span> {project.zone}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  {dateStr}
                </span>
                {project.duration_days && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    {project.duration_days} jour{project.duration_days > 1 ? "s" : ""}
                  </span>
                )}
                {project.budget_range && (
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-primary" />
                    {project.budget_range}
                  </span>
                )}
              </div>
            </header>

            {/* Cover */}
            {cover && (
              <div className="rounded-xl overflow-hidden mb-10 bg-muted">
                <img
                  src={getChantierImageUrl(cover.storage_path)}
                  alt={cover.caption ?? project.title}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Récit */}
            {project.story && (
              <section className="mb-10">
                <ProjectStory markdown={project.story} />
              </section>
            )}

            {/* Avant/après */}
            {pairs.length > 0 && (
              <section className="mb-10">
                <h2 className="font-display text-2xl font-bold mb-4">
                  Avant / Après
                </h2>
                <div className="space-y-6">
                  {pairs.map((pair, idx) => (
                    <BeforeAfterSlider
                      key={`${pair.before.id}-${pair.after.id}`}
                      before={pair.before}
                      after={pair.after}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Galerie */}
            {images.filter((i) => i.kind === "photo").length > 0 && (
              <section className="mb-10">
                <h2 className="font-display text-2xl font-bold mb-4">
                  Galerie photos
                </h2>
                <ProjectGallery images={images} />
              </section>
            )}

            {/* FAQ */}
            {project.faq && project.faq.length > 0 && (
              <section className="mb-10">
                <h2 className="font-display text-2xl font-bold mb-4">
                  Questions fréquentes
                </h2>
                <ProjectFAQ items={project.faq} />
              </section>
            )}

            {/* CTA */}
            <div className="border-t border-border pt-8 mt-12">
              <h3 className="font-display text-xl font-bold mb-2">
                Vous avez un projet similaire ?
              </h3>
              <p className="text-muted-foreground mb-4">
                Contactez-nous pour un devis gratuit et personnalisé.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/contact">Demander un devis</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/realisations">
                    <ArrowLeft className="w-4 h-4" />
                    Toutes les réalisations
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default ChantierDetail;
