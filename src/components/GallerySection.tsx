import { useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";
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

// Import gallery images - Éclairage LED
import installationComplete from "@/assets/gallery/installation-complete.jpg";
import priseSolDesign from "@/assets/gallery/prise-sol-design.jpg";
import priseEtancheBriques from "@/assets/gallery/prise-etanche-briques.jpg";

// Import gallery images - Installation réseaux
import visiophonieExterieur from "@/assets/gallery/visiophone-exterieur.jpg";
import switchReseau from "@/assets/gallery/switch-reseau.jpg";

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
    label: "Tableaux électriques",
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
    ],
  },
  {
    id: "eclairage",
    label: "Éclairage LED & Moderne",
    description: "Solutions d'éclairage innovantes",
    coverImage: priseSolDesign,
    images: [
      { id: 1, title: "Installation complète", image: installationComplete },
      { id: 2, title: "Prise de sol design", image: priseSolDesign },
      { id: 3, title: "Prise étanche intégrée", image: priseEtancheBriques },
    ],
  },
  {
    id: "reseaux",
    label: "Installation Réseaux",
    description: "Câblage et connectivité",
    coverImage: switchReseau,
    images: [
      { id: 1, title: "Visiophone extérieur", image: visiophonieExterieur },
      { id: 2, title: "Installation réseau", image: switchReseau },
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

  const handleCategoryClick = (category: typeof categories[0]) => {
    setSelectedCategory(category);
    setCurrentImageIndex(0);
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setCurrentImageIndex(0);
  };

  const handlePrev = () => {
    if (selectedCategory) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedCategory.images.length - 1 : prev - 1
      );
    }
  };

  const handleNext = () => {
    if (selectedCategory) {
      setCurrentImageIndex((prev) => 
        prev === selectedCategory.images.length - 1 ? 0 : prev + 1
      );
    }
  };

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

      {/* Gallery Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl p-4 md:p-6"
            onClick={handleClose}
          >
            {/* Close button */}
            <motion.button 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-card-foreground hover:text-primary transition-colors z-10"
              onClick={handleClose}
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Navigation arrows */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute left-4 md:left-8 w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-4 md:right-8 w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
            
            {/* Image container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="max-w-5xl w-full max-h-[85vh] rounded-[2rem] overflow-hidden bg-card border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={currentImageIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.2 }}
                    src={selectedCategory.images[currentImageIndex].image} 
                    alt={selectedCategory.images[currentImageIndex].title}
                    className="w-full h-full object-contain max-h-[65vh]"
                  />
                </AnimatePresence>
              </div>
              <div className="p-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-card-foreground font-display font-bold text-xl mb-1">
                      {selectedCategory.images[currentImageIndex].title}
                    </p>
                    <p className="text-primary">
                      {selectedCategory.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Images className="w-5 h-5" />
                    <span className="font-medium">{currentImageIndex + 1} / {selectedCategory.images.length}</span>
                  </div>
                </div>
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      
      {/* Shimmer effect - Orange glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        {/* Animated border glow */}
        <div className="absolute inset-0 rounded-[2rem] border-2 border-primary/50" />
        
        {/* Shimmer sweep */}
        <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
        
        {/* Corner sparkles */}
        <motion.div 
          className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-8 right-8 w-1.5 h-1.5 bg-primary/70 rounded-full"
          animate={{ 
            scale: [1, 1.8, 1],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
        <motion.div 
          className="absolute top-6 right-12 w-1 h-1 bg-primary/50 rounded-full"
          animate={{ 
            scale: [1, 2, 1],
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }}
        />
      </div>
      
      {/* Pulsing glow effect on hover */}
      <motion.div 
        className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: "inset 0 0 60px rgba(232, 121, 59, 0.3), 0 0 40px rgba(232, 121, 59, 0.2)"
        }}
      />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
        {/* Photo count badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-primary/90 text-white text-sm font-medium rounded-full backdrop-blur-sm">
          <Images className="w-4 h-4" />
          <span>{category.images.length} photos</span>
        </div>
        
        {/* Title & description */}
        <div className="transform transition-transform duration-300 group-hover:translate-y-[-8px]">
          <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
            {category.label}
          </h3>
          <p className="text-white/80 text-sm md:text-base">
            {category.description}
          </p>
        </div>
        
        {/* CTA hint */}
        <motion.div 
          className="mt-4 flex items-center gap-2 text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={{ x: -10 }}
          whileHover={{ x: 0 }}
        >
          <span>Voir les réalisations</span>
          <ChevronRight className="w-5 h-5" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GallerySection;
