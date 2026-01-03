import { useState, useRef, useMemo, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Images, Zap } from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";

// Import gallery images - Tableaux électriques
import tableauRgie from "@/assets/gallery/tableau-rgie.jpg";
import tableauAbbOuvert from "@/assets/gallery/tableaux/tableau-abb-ouvert.jpg";
import tableauVitreCe from "@/assets/gallery/tableaux/tableau-vitre-ce.jpg";
import tableauGrandCablage from "@/assets/gallery/tableaux/tableau-grand-cablage.jpg";
import tableauBornierTerre from "@/assets/gallery/tableaux/tableau-bornier-terre.jpg";
import tableauCompact from "@/assets/gallery/tableaux/tableau-compact.jpg";
import tableauSchneider from "@/assets/gallery/tableaux/tableau-schneider.jpg";
import tableauVitre400v from "@/assets/gallery/tableaux/tableau-vitre-400v.jpg";
import tableauSchneiderOuvert from "@/assets/gallery/tableaux/tableau-schneider-ouvert.jpg";

// Import gallery images - Prises
import installationComplete from "@/assets/gallery/installation-complete.jpg";
import priseSolDesign from "@/assets/gallery/prise-sol-design.jpg";
import priseEtancheBriques from "@/assets/gallery/prise-etanche-briques.jpg";

// Import gallery images - Ambiances Lumineuses (LED) - Sélection des plus belles
import luminaireDesign from "@/assets/gallery/eclairage-led/luminaire-design.jpg";
import garageLed1 from "@/assets/gallery/eclairage-led/garage-led-1.jpg";
import garageLed2 from "@/assets/gallery/eclairage-led/garage-led-2.jpg";
import facadeNuit from "@/assets/gallery/eclairage-led/facade-nuit.jpg";
import barLedVert from "@/assets/gallery/eclairage-led/bar-led-vert.jpg";
import plafondIndirect from "@/assets/gallery/eclairage-led/plafond-indirect.jpg";
import ledAmbiance1 from "@/assets/gallery/eclairage-led/led-ambiance-1.jpg";
import ledSpot1 from "@/assets/gallery/eclairage-led/led-spot-1.jpg";
import ledCuisine1 from "@/assets/gallery/eclairage-led/led-cuisine-1.jpg";
import ledPlafond1 from "@/assets/gallery/eclairage-led/led-plafond-1.jpg";

// Import gallery images - Installation réseaux
import visiophonieExterieur from "@/assets/gallery/visiophone-exterieur.jpg";
import switchReseau from "@/assets/gallery/switch-reseau.jpg";
import baieBrassageAvant from "@/assets/gallery/installation-reseaux/baie-brassage-avant.jpg";
import baieBrassageFini from "@/assets/gallery/installation-reseaux/baie-brassage-fini.jpg";

// Import gallery images - Décoration de Noël
import illuminationsRue from "@/assets/gallery/noel/illuminations-rue.jpg";
import chaletNoel from "@/assets/gallery/noel/chalet-noel.jpg";
import centreCommercialSapin from "@/assets/gallery/noel/centre-commercial-sapin.jpg";
import calendrierAvent from "@/assets/gallery/noel/calendrier-avent.jpg";
import grandeRoueNoel from "@/assets/gallery/noel/grande-roue-noel.jpg";
import sapinGeant from "@/assets/gallery/noel/sapin-geant.jpg";
import etoilesPlafond from "@/assets/gallery/noel/etoiles-plafond.jpg";
import guirlandeBleu from "@/assets/gallery/noel/guirlande-bleu.jpg";
import lumieresFacade from "@/assets/gallery/noel/lumieres-facade.jpg";
import decorVitrine from "@/assets/gallery/noel/decor-vitrine.jpg";
import sapinLumineux from "@/assets/gallery/noel/sapin-lumineux.jpg";
import decorationExterieure from "@/assets/gallery/noel/decoration-exterieure.jpg";
import illuminationBatiment from "@/assets/gallery/noel/illumination-batiment.jpg";
import lumieresNuit from "@/assets/gallery/noel/lumieres-nuit.jpg";
import guirlandeLed from "@/assets/gallery/noel/guirlande-led.jpg";
import decorationRue from "@/assets/gallery/noel/decoration-rue.jpg";
import archeLumineuse from "@/assets/gallery/noel/arche-lumineuse.jpg";
import montgolfiereChapitau from "@/assets/gallery/noel/montgolfiere-chapiteau.jpg";
import sceneMusiciens from "@/assets/gallery/noel/scene-musiciens.jpg";
import decorCadeaux from "@/assets/gallery/noel/decor-cadeaux.jpg";
import installationGalerie from "@/assets/gallery/noel/installation-galerie.jpg";
import guirlandesCentreCommercial from "@/assets/gallery/noel/guirlandes-centre-commercial.jpg";
import sapinLumineuxNuit from "@/assets/gallery/noel/sapin-lumineux-nuit.jpg";
import renneGeant from "@/assets/gallery/noel/renne-geant.jpg";

// Catégories avec image de référence et toutes les images
const categories = [
  {
    id: "tableaux",
    label: "Tableaux et prises",
    description: "Installations aux normes RGIE",
    coverImage: tableauSchneider,
    images: [
      { id: 1, title: "Tableau électrique RGIE", image: tableauRgie },
      { id: 2, title: "Tableau ABB neuf", image: tableauAbbOuvert },
      { id: 3, title: "Tableau vitré 3x240V", image: tableauVitreCe },
      { id: 4, title: "Tableau complet câblé", image: tableauGrandCablage },
      { id: 5, title: "Tableau avec bornier de terre", image: tableauBornierTerre },
      { id: 6, title: "Tableau compact résidentiel", image: tableauCompact },
      { id: 7, title: "Tableau Schneider", image: tableauSchneider },
      { id: 8, title: "Tableau vitré 3x400V+N", image: tableauVitre400v },
      { id: 9, title: "Tableau Schneider ouvert", image: tableauSchneiderOuvert },
      { id: 10, title: "Installation complète", image: installationComplete },
      { id: 11, title: "Prise de sol design", image: priseSolDesign },
      { id: 12, title: "Prise étanche intégrée", image: priseEtancheBriques },
    ],
  },
  {
    id: "eclairage",
    label: "Ambiances Lumineuses",
    description: "Éclairage LED sur mesure",
    coverImage: facadeNuit,
    images: [
      { id: 1, title: "Façade illuminée de nuit", image: facadeNuit },
      { id: 2, title: "Bar LED design", image: barLedVert },
      { id: 3, title: "Luminaire suspendu moderne", image: luminaireDesign },
      { id: 4, title: "Garage LED professionnel", image: garageLed1 },
      { id: 5, title: "Atelier LED complet", image: garageLed2 },
      { id: 6, title: "Plafond indirect LED", image: plafondIndirect },
      { id: 7, title: "Ambiance LED moderne", image: ledAmbiance1 },
      { id: 8, title: "Spots LED encastrés", image: ledSpot1 },
      { id: 9, title: "Cuisine LED moderne", image: ledCuisine1 },
      { id: 10, title: "Faux-plafond LED", image: ledPlafond1 },
    ],
  },
  {
    id: "reseaux",
    label: "Installation Réseaux",
    description: "Câblage et connectivité",
    coverImage: baieBrassageFini,
    images: [
      { id: 1, title: "Visiophone extérieur", image: visiophonieExterieur },
      { id: 2, title: "Installation réseau", image: switchReseau },
      { id: 3, title: "Baie de brassage - Avant", image: baieBrassageAvant },
      { id: 4, title: "Baie de brassage - Terminé", image: baieBrassageFini },
    ],
  },
  {
    id: "noel",
    label: "Décoration de Noël",
    description: "Illuminations féeriques",
    coverImage: montgolfiereChapitau,
    images: [
      { id: 1, title: "Montgolfière sous chapiteau", image: montgolfiereChapitau },
      { id: 2, title: "Illuminations de rue", image: illuminationsRue },
      { id: 3, title: "Décoration chalet festif", image: chaletNoel },
      { id: 4, title: "Sapin géant centre commercial", image: centreCommercialSapin },
      { id: 5, title: "Calendrier de l'Avent lumineux", image: calendrierAvent },
      { id: 6, title: "Grande roue de Noël", image: grandeRoueNoel },
      { id: 7, title: "Sapin et décor féerique", image: sapinGeant },
      { id: 8, title: "Étoiles suspendues", image: etoilesPlafond },
      { id: 9, title: "Guirlande bleue festive", image: guirlandeBleu },
      { id: 10, title: "Lumières de façade", image: lumieresFacade },
      { id: 11, title: "Décor de vitrine", image: decorVitrine },
      { id: 12, title: "Sapin lumineux extérieur", image: sapinLumineux },
      { id: 13, title: "Décoration extérieure", image: decorationExterieure },
      { id: 14, title: "Illumination de bâtiment", image: illuminationBatiment },
      { id: 15, title: "Lumières de nuit", image: lumieresNuit },
      { id: 16, title: "Guirlande LED moderne", image: guirlandeLed },
      { id: 17, title: "Décoration de rue festive", image: decorationRue },
      { id: 18, title: "Arche lumineuse", image: archeLumineuse },
      { id: 19, title: "Scène musiciens de Noël", image: sceneMusiciens },
      { id: 20, title: "Décor de cadeaux géants", image: decorCadeaux },
      { id: 21, title: "Installation en galerie", image: installationGalerie },
      { id: 22, title: "Guirlandes centre commercial", image: guirlandesCentreCommercial },
      { id: 23, title: "Sapin lumineux nocturne", image: sapinLumineuxNuit },
      { id: 24, title: "Renne géant décoratif", image: renneGeant },
    ],
  },
];

const GallerySection = () => {
  const [selectedCategory, setSelectedCategory] = useState<typeof categories[0] | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ image: string; title: string; index: number } | null>(null);
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

  const handleCategoryClick = (category: typeof categories[0]) => {
    setSelectedCategory(category);
  };

  const handleCloseCategory = () => {
    setSelectedCategory(null);
  };

  const handleImageClick = (image: string, title: string, index: number) => {
    setLightboxImage({ image, title, index });
  };

  const handleCloseLightbox = () => {
    setLightboxImage(null);
  };

  const handlePrevImage = () => {
    if (lightboxImage && selectedCategory) {
      const newIndex = lightboxImage.index === 0 
        ? selectedCategory.images.length - 1 
        : lightboxImage.index - 1;
      const img = selectedCategory.images[newIndex];
      setLightboxImage({ image: img.image, title: img.title, index: newIndex });
    }
  };

  const handleNextImage = () => {
    if (lightboxImage && selectedCategory) {
      const newIndex = lightboxImage.index === selectedCategory.images.length - 1 
        ? 0 
        : lightboxImage.index + 1;
      const img = selectedCategory.images[newIndex];
      setLightboxImage({ image: img.image, title: img.title, index: newIndex });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxImage) return;
      if (e.key === "Escape") handleCloseLightbox();
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage, selectedCategory]);

  return (
    <section id="realisations" className="py-24 md:py-32 bg-background relative overflow-hidden">
      {/* Background accent */}
      <motion.div 
        className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ 
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="container mx-auto relative z-10">
        {/* Section header */}
        <div ref={headerRef} className="text-center mb-12 md:mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-sm font-medium rounded-full mb-6"
          >
            Nos Réalisations
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
          >
            La propreté{" "}
            <span className="text-gradient-copper">comme signature</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg"
          >
            Chaque câble a sa place, chaque connexion est parfaite. Découvrez notre travail minutieux.
          </motion.p>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {categories.map((category, index) => (
            <CategoryCard 
              key={category.id}
              category={category}
              index={index}
              onClick={() => handleCategoryClick(category)}
            />
          ))}
        </div>
      </div>

      {/* Category Gallery Modal - Grid of thumbnails */}
      <AnimatePresence>
        {selectedCategory && !lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto"
            onClick={handleCloseCategory}
          >
            {/* Close button */}
            <motion.button 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="fixed top-4 right-4 md:top-6 md:right-6 w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-card-foreground hover:text-primary transition-colors z-10"
              onClick={handleCloseCategory}
            >
              <X className="w-6 h-6" />
            </motion.button>

            <div className="container mx-auto py-20 px-4" onClick={(e) => e.stopPropagation()}>
              {/* Category Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center mb-12"
              >
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {selectedCategory.label}
                </h2>
                <p className="text-muted-foreground">{selectedCategory.description}</p>
                <p className="text-primary mt-2 font-medium">{selectedCategory.images.length} photos</p>
              </motion.div>

              {/* Images Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedCategory.images.map((img, index) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                    onClick={() => handleImageClick(img.image, img.title, index)}
                  >
                    <img
                      src={img.image}
                      alt={img.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-white text-sm font-medium truncate">{img.title}</p>
                    </div>
                    {/* Zoom icon */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Lightbox - Single Image View */}
      <AnimatePresence>
        {lightboxImage && selectedCategory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
            onClick={handleCloseLightbox}
          >
            {/* Close button */}
            <motion.button 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
              onClick={handleCloseLightbox}
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Navigation arrows */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute left-4 md:left-8 w-12 h-12 rounded-full bg-primary/30 border border-primary/50 flex items-center justify-center text-white hover:bg-primary transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute right-4 md:right-8 w-12 h-12 rounded-full bg-primary/30 border border-primary/50 flex items-center justify-center text-white hover:bg-primary transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
            
            {/* Image */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="max-w-6xl w-full max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.img 
                  key={lightboxImage.index}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2 }}
                  src={lightboxImage.image} 
                  alt={lightboxImage.title}
                  className="max-h-[75vh] w-auto object-contain rounded-2xl"
                />
              </AnimatePresence>
              <div className="mt-4 text-center">
                <p className="text-white font-display font-bold text-xl">
                  {lightboxImage.title}
                </p>
                <p className="text-white/60 mt-1">
                  {lightboxImage.index + 1} / {selectedCategory.images.length}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

interface CategoryCardProps {
  category: typeof categories[0];
  index: number;
  onClick: () => void;
}

const CategoryCard = ({ category, index, onClick }: CategoryCardProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  // Generate orbital particles positions
  const particles = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      angle: (i * 45) * (Math.PI / 180),
      radius: 55,
      size: Math.random() * 4 + 3,
      duration: 4 + Math.random() * 2,
      delay: i * 0.2,
    }));
  }, []);

  // Generate electric arc paths
  const arcs = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => ({
      id: i,
      rotation: i * 120,
      delay: i * 0.8,
    }));
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative aspect-[4/3] rounded-[2rem] overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* Image */}
      <img 
        src={category.coverImage} 
        alt={category.label}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      
      {/* ===== ELECTRIC VORTEX ANIMATION ===== */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        
        {/* Outer energy field - rotating ring */}
        <motion.div
          className="absolute -inset-16 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent, rgba(232, 121, 59, 0.3), transparent, rgba(232, 121, 59, 0.5), transparent)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Second rotating ring - opposite direction */}
        <motion.div
          className="absolute -inset-12 rounded-full"
          style={{
            background: "conic-gradient(from 180deg, transparent, rgba(255, 165, 89, 0.2), transparent, rgba(232, 121, 59, 0.4), transparent)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Orbiting particles with trails */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute"
            style={{
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              x: [
                Math.cos(particle.angle) * particle.radius,
                Math.cos(particle.angle + Math.PI) * particle.radius,
                Math.cos(particle.angle + Math.PI * 2) * particle.radius,
              ],
              y: [
                Math.sin(particle.angle) * particle.radius,
                Math.sin(particle.angle + Math.PI) * particle.radius,
                Math.sin(particle.angle + Math.PI * 2) * particle.radius,
              ],
              scale: [1, 1.5, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "linear",
              delay: particle.delay + index * 0.5,
            }}
          >
            <div 
              className="w-full h-full rounded-full bg-primary"
              style={{
                boxShadow: "0 0 10px rgba(232, 121, 59, 0.8), 0 0 20px rgba(232, 121, 59, 0.5), 0 0 30px rgba(232, 121, 59, 0.3)",
              }}
            />
            {/* Particle trail */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-gradient-to-r from-primary/60 to-transparent rounded-full"
              style={{
                transformOrigin: "left center",
              }}
              animate={{
                rotate: [0, 360],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </motion.div>
        ))}
        
        {/* Electric arcs - lightning bolts */}
        {arcs.map((arc) => (
          <motion.div
            key={arc.id}
            className="absolute w-24 h-0.5 origin-left"
            style={{
              rotate: arc.rotation,
              left: 0,
              top: 0,
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{
              scaleX: [0, 1, 0.3, 1, 0],
              opacity: [0, 1, 0.5, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: arc.delay + index * 0.3,
              ease: "easeInOut",
            }}
          >
            <svg viewBox="0 0 100 10" className="w-full h-full overflow-visible">
              <motion.path
                d="M0,5 L20,2 L35,8 L50,3 L65,7 L80,4 L100,5"
                stroke="url(#electricGradient)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                animate={{
                  pathLength: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: arc.delay,
                }}
              />
              <defs>
                <linearGradient id="electricGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(232, 121, 59, 0.8)" />
                  <stop offset="50%" stopColor="rgba(255, 200, 100, 1)" />
                  <stop offset="100%" stopColor="rgba(232, 121, 59, 0.3)" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        ))}
        
        {/* Central pulsing core */}
        <motion.div
          className="absolute -inset-6 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(232, 121, 59, 0.4) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Energy burst effect */}
        <motion.div
          className="absolute -inset-10 rounded-full"
          animate={{
            boxShadow: [
              "0 0 30px rgba(232, 121, 59, 0.3), inset 0 0 30px rgba(232, 121, 59, 0.2)",
              "0 0 60px rgba(232, 121, 59, 0.6), inset 0 0 40px rgba(232, 121, 59, 0.4)",
              "0 0 30px rgba(232, 121, 59, 0.3), inset 0 0 30px rgba(232, 121, 59, 0.2)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.2,
          }}
        />
        
        {/* Central icon with electric glow */}
        <motion.div 
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary via-primary to-orange-400 flex items-center justify-center z-10"
          animate={{
            boxShadow: [
              "0 0 20px rgba(232, 121, 59, 0.6), 0 0 40px rgba(232, 121, 59, 0.4), 0 0 60px rgba(232, 121, 59, 0.2)",
              "0 0 30px rgba(255, 200, 100, 0.8), 0 0 60px rgba(232, 121, 59, 0.6), 0 0 90px rgba(232, 121, 59, 0.3)",
              "0 0 20px rgba(232, 121, 59, 0.6), 0 0 40px rgba(232, 121, 59, 0.4), 0 0 60px rgba(232, 121, 59, 0.2)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          whileHover={{
            scale: 1.15,
            boxShadow: "0 0 50px rgba(255, 200, 100, 1), 0 0 80px rgba(232, 121, 59, 0.8)",
          }}
        >
          <Zap className="w-7 h-7 text-white" fill="currentColor" />
          
          {/* Sparkle effects on the icon */}
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.3,
            }}
          />
          <motion.div
            className="absolute -bottom-1 -left-1 w-2 h-2 bg-orange-200 rounded-full"
            animate={{
              scale: [0, 1.2, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: 0.8,
            }}
          />
        </motion.div>
      </div>
      
      {/* Shimmer sweep on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-[2rem] border-2 border-primary/60" />
        <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
            initial={{ x: "-100%" }}
            whileInView={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
          />
        </div>
      </div>
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
        {/* Photo count badge */}
        <motion.div 
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-primary/90 text-white text-sm font-medium rounded-full backdrop-blur-sm"
          animate={{
            boxShadow: [
              "0 0 10px rgba(232, 121, 59, 0.3)",
              "0 0 20px rgba(232, 121, 59, 0.6)",
              "0 0 10px rgba(232, 121, 59, 0.3)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Images className="w-4 h-4" />
          <span>{category.images.length} photos</span>
        </motion.div>
        
        {/* Title & description */}
        <div className="transform transition-transform duration-300 group-hover:translate-y-[-8px]">
          <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
            {category.label}
          </h3>
          <p className="text-white/80 text-sm md:text-base drop-shadow-md">
            {category.description}
          </p>
        </div>
        
        {/* CTA hint */}
        <motion.div 
          className="mt-4 flex items-center gap-2 text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <span>Voir les réalisations</span>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GallerySection;
