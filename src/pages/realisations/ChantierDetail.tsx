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
  ArrowRight,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-copper" />
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

  const befores = images.filter((i) => i.kind === "before");
  const afters = images.filter((i) => i.kind === "after");
  const pairs = befores.slice(0, afters.length).map((b, i) => ({
    before: b,
    after: afters[i],
  }));

  const cover =
    images.find((i) => i.is_cover) ??
    images.find((i) => i.kind === "photo") ??
    images[0] ??
    null;

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

      {/* HERO éditorial sombre */}
      <section className="relative bg-anthracite pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[700px] h-[400px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-copper/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Lien retour subtil */}
          <Link
            to="/realisations"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-copper-light hover:text-copper transition-colors mb-6 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Toutes les réalisations
          </Link>

          {/* Tags pills cliquables */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/realisations?tag=${encodeURIComponent(tag)}`}
                  className="text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full bg-copper/15 text-copper-light border border-copper/30 hover:bg-copper hover:text-primary-foreground transition-all"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Titre */}
          <h1 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-cream max-w-4xl mb-5">
            {project.title}
          </h1>

          {/* Lead */}
          <p className="text-lg md:text-xl text-cream-dark/85 max-w-3xl leading-relaxed mb-8">
            {project.summary}
          </p>

          {/* Méta */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-cream-dark/70 pt-5 border-t border-cream-dark/10">
            <span className="inline-flex items-center gap-2">
              <MapPin className="w-4 h-4 text-copper" />
              <span className="text-cream">{project.location}</span>
              <span className="text-cream-dark/40">·</span>
              <span>{project.zone}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar className="w-4 h-4 text-copper" />
              {dateStr}
            </span>
            {project.duration_days && (
              <span className="inline-flex items-center gap-2">
                <Clock className="w-4 h-4 text-copper" />
                {project.duration_days} jour
                {project.duration_days > 1 ? "s" : ""}
              </span>
            )}
            {project.budget_range && (
              <span className="inline-flex items-center gap-2">
                <Wallet className="w-4 h-4 text-copper" />
                {project.budget_range}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* COVER en pleine largeur, fait la transition entre hero sombre et body clair */}
      {cover && (
        <div className="bg-anthracite">
          <div className="container mx-auto px-4 pb-12 md:pb-16">
            <div className="rounded-2xl overflow-hidden bg-anthracite-light shadow-2xl">
              <img
                src={getChantierImageUrl(cover.storage_path)}
                alt={cover.caption ?? project.title}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      )}

      {/* BODY en fond clair pour la lecture */}
      <main className="py-16 md:py-20">
        <article className="container mx-auto px-4 max-w-4xl">
          {/* Récit */}
          {project.story && (
            <section className="mb-14 md:mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Le chantier en détail
              </h2>
              <ProjectStory markdown={project.story} />
            </section>
          )}

          {/* Avant/Après */}
          {pairs.length > 0 && (
            <section className="mb-14 md:mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-copper to-transparent" />
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Avant / Après
                </h2>
                <div className="h-px flex-1 bg-gradient-to-l from-copper to-transparent" />
              </div>
              <div className="space-y-6">
                {pairs.map((pair) => (
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
            <section className="mb-14 md:mb-16">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-6 text-foreground">
                Galerie photos
              </h2>
              <ProjectGallery images={images} />
            </section>
          )}

          {/* FAQ */}
          {project.faq && project.faq.length > 0 && (
            <section className="mb-14 md:mb-16">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-6 text-foreground">
                Questions fréquentes
              </h2>
              <ProjectFAQ items={project.faq} />
            </section>
          )}
        </article>
      </main>

      {/* CTA final sombre, rappel du Hero */}
      <section className="relative bg-anthracite py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 text-center max-w-2xl">
          <p className="text-xs uppercase tracking-[0.25em] text-copper-light font-semibold mb-4">
            On parle de votre projet ?
          </p>
          <h3 className="font-display font-black text-3xl md:text-4xl text-cream mb-4">
            Vous avez un projet{" "}
            <span className="text-gradient-copper">similaire</span> ?
          </h3>
          <p className="text-cream-dark/80 text-lg mb-8">
            Devis gratuit, déplacement offert dans le Brabant wallon. Réponse
            en 24h ouvrées.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="copper" size="lg" asChild>
              <Link to="/contact">
                Demander un devis gratuit
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              variant="copperOutline"
              size="lg"
              asChild
              className="text-cream border-cream/30 hover:border-copper hover:text-copper"
            >
              <Link to="/realisations">
                <ArrowLeft className="w-4 h-4" />
                Toutes les réalisations
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default ChantierDetail;
