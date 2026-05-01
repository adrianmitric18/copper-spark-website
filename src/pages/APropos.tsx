import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import Breadcrumbs from "@/components/Breadcrumbs";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-electricite.jpg";

/**
 * Page À propos — 4 blocs (cf. brief) :
 *   1. Photo Adrian (placeholder stock — TODO remplacer par photo réelle)
 *   2. Timeline parcours
 *   3. Philosophie (3-4 punchlines pro élégant)
 *   4. Showcase matériel (outils + matériel posé)
 */

const timeline = [
  {
    year: "2020",
    title: "Création du Cuivre Électrique",
    body: "Lancement de l'activité d'électricien indépendant à Court-Saint-Étienne, en Brabant wallon.",
  },
  {
    year: "2021",
    title: "Spécialisation rénovation et RGIE",
    body: "Premiers gros chantiers de rénovation complète et de mise en conformité d'installations anciennes.",
  },
  {
    year: "2023",
    title: "Bornes de recharge et photovoltaïque",
    body: "Formation et certifications pour la pose de bornes VE et de panneaux photovoltaïques résidentiels.",
  },
  {
    year: "2026",
    title: "200+ chantiers, 4,94/5 sur Google",
    body: "L'activité tient sur le bouche-à-oreille et les avis Google. Aucun marketing payant à la pose.",
  },
];

const philosophy = [
  {
    title: "Le câble bien posé sauve dix dépannages.",
    body: "Investir un peu plus de temps en pose évite des appels d'urgence des années plus tard. Vous payez une fois, et vous oubliez l'installation.",
  },
  {
    title: "Le devis qui change en cours de chantier n'est pas un devis.",
    body: "Toute modification est validée avec vous avant de continuer. Pas de facture surprise à la fin du chantier.",
  },
  {
    title: "Une installation propre se voit derrière le tableau.",
    body: "Les câbles rangés, étiquetés et serrés au couple sont la preuve qu'un professionnel est passé. C'est ce qui distingue un travail durable.",
  },
];

const tools = [
  { brand: "Wera", note: "Tournevis isolés 1000 V" },
  { brand: "Knipex", note: "Pinces et coupants" },
  { brand: "Fluke", note: "Multimètre, testeur RGIE" },
];

const installed = [
  { brand: "Schneider Electric", note: "Tableaux, disjoncteurs" },
  { brand: "Hager", note: "Tableaux résidentiels, modulaire" },
  { brand: "Niko", note: "Appareillage, domotique" },
  { brand: "Alfen", note: "Bornes VE Eve Pro-line" },
];

const APropos = () => {
  const reduce = useReducedMotion();
  const fadeUp = {
    hidden: { opacity: 0, y: reduce ? 0 : 16 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-dvh bg-background overflow-x-hidden">
      <SEO
        title="À propos | Le Cuivre Électrique — Adrian Mitric, électricien à Court-Saint-Étienne"
        description="Adrian Mitric, électricien indépendant à Court-Saint-Étienne. Parcours, philosophie de travail et matériel utilisé sur les chantiers en Brabant wallon."
        canonical="https://cuivre-electrique.com/a-propos"
      />
      <StructuredData
        type="BreadcrumbList"
        items={[
          { name: "Accueil", url: "https://cuivre-electrique.com/" },
          { name: "À propos", url: "https://cuivre-electrique.com/a-propos" },
        ]}
      />
      <Header />

      <main className="pt-24">
        <div className="container mx-auto max-w-6xl">
          <Breadcrumbs items={[{ label: "À propos", href: "/a-propos" }]} />
        </div>

        {/* === [1] Hero + photo === */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-7">
              <p className="section-marker mb-6 inline-block">
                <span className="section-marker-num">I.</span> À propos
              </p>
              <motion.h1
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-[-0.025em] leading-tight mb-8"
              >
                Adrian Mitric, fondateur du
                <span className="text-primary"> Cuivre Électrique</span>.
              </motion.h1>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-5 text-base md:text-lg text-foreground/85 leading-relaxed"
              >
                <p>
                  Électricien indépendant à Court-Saint-Étienne, j'interviens
                  dans tout le Brabant wallon en installation, rénovation,
                  conformité RGIE, bornes de recharge et photovoltaïque.
                </p>
                <p className="text-muted-foreground">
                  L'activité est organisée pour que vous échangiez avec une
                  seule personne du devis à la fin du chantier. Le matériel est
                  choisi pour durer — pas pour faire entrer un nom dans le
                  devis.
                </p>
              </motion.div>
            </div>

            {/* Photo (placeholder stock — TODO photo réelle Adrian) */}
            <motion.div
              initial={{ opacity: 0, y: reduce ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-5"
            >
              <figure className="rounded-2xl overflow-hidden border border-border bg-card shadow-md">
                <div className="aspect-[4/5] overflow-hidden bg-cream-paper">
                  <img
                    src={heroImage}
                    alt="Adrian Mitric, électricien indépendant en chantier en Brabant wallon"
                    width={800}
                    height={1000}
                    className="w-full h-full object-cover"
                    loading="eager"
                    fetchPriority="high"
                  />
                </div>
                <figcaption className="px-5 py-4 border-t border-border text-sm text-muted-foreground">
                  Court-Saint-Étienne, Belgique · TVA BE 0805.376.944
                </figcaption>
              </figure>
            </motion.div>
          </div>
        </section>

        {/* === [2] Timeline parcours === */}
        <section className="py-20 md:py-28 bg-cream-paper">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-12 gap-6 mb-12 md:mb-14">
              <div className="col-span-12 md:col-span-3">
                <p className="section-marker">
                  <span className="section-marker-num">II.</span> Parcours
                </p>
              </div>
              <div className="col-span-12 md:col-span-9">
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-[-0.025em] leading-tight">
                  Quatre ans à se construire
                  <br className="hidden sm:block" /> sur le terrain.
                </h2>
              </div>
            </div>

            <ol className="space-y-8 max-w-3xl ml-auto">
              {timeline.map((t, i) => (
                <motion.li
                  key={t.year}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  className="relative pl-24 md:pl-28 border-l border-border ml-4"
                >
                  <span className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold tabular-nums">
                    {i + 1}
                  </span>
                  <span className="absolute left-6 md:left-8 top-0 font-display text-2xl md:text-3xl font-bold text-primary tabular-nums">
                    {t.year}
                  </span>
                  <h3 className="font-display text-lg md:text-xl font-bold text-foreground mb-2 leading-snug">
                    {t.title}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    {t.body}
                  </p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* === [3] Philosophie === */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-12 gap-6 mb-12 md:mb-14">
              <div className="col-span-12 md:col-span-3">
                <p className="section-marker">
                  <span className="section-marker-num">III.</span> Philosophie
                </p>
              </div>
              <div className="col-span-12 md:col-span-9">
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-[-0.025em] leading-tight">
                  Trois principes qui tiennent
                  <br className="hidden sm:block" /> sur tous les chantiers.
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {philosophy.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  className="relative pl-6 border-l-2 border-primary"
                >
                  <h3 className="font-display text-lg md:text-xl font-bold text-foreground mb-3 leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    {p.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* === [4] Matériel showcase === */}
        <section className="py-20 md:py-28 bg-cream-paper border-t border-border">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-12 gap-6 mb-12 md:mb-14">
              <div className="col-span-12 md:col-span-3">
                <p className="section-marker">
                  <span className="section-marker-num">IV.</span> Matériel
                </p>
              </div>
              <div className="col-span-12 md:col-span-9">
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-[-0.025em] leading-tight">
                  Les outils et le matériel
                  <br className="hidden sm:block" /> que je préfère.
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-5">
                  Sur ma ceinture
                </p>
                <ul className="divide-y divide-border">
                  {tools.map((t) => (
                    <li
                      key={t.brand}
                      className="flex items-baseline justify-between py-3.5"
                    >
                      <span className="font-display font-bold text-foreground">
                        {t.brand}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t.note}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-5">
                  Posé chez vous
                </p>
                <ul className="divide-y divide-border">
                  {installed.map((m) => (
                    <li
                      key={m.brand}
                      className="flex items-baseline justify-between py-3.5"
                    >
                      <span className="font-display font-bold text-foreground">
                        {m.brand}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {m.note}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-10 text-sm text-muted-foreground max-w-2xl">
              Ces marques sont posées régulièrement parce qu'elles tiennent
              dans le temps. Si vous préférez une autre marque (Legrand, Niko
              Home Control, etc.), c'est aussi possible — on en discute au
              devis.
            </p>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-16 md:py-20 bg-anthracite text-background">
          <div className="container mx-auto max-w-3xl text-center">
            <p className="font-display text-2xl md:text-3xl font-bold leading-tight mb-2">
              Vous avez un projet en tête ?
            </p>
            <p className="text-base md:text-lg text-background/70 mb-8">
              Décrivez-le par devis ou par téléphone, on regarde ensemble.
            </p>
            <Button variant="copper" size="xl" asChild className="group">
              <Link to="/contact">
                Demander un devis
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default APropos;
