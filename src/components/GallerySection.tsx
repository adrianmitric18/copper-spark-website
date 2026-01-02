import { useState, useRef } from "react";
import { X, ZoomIn } from "lucide-react";
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

// Catégories disponibles
const categories = [
  { id: "all", label: "Tout voir" },
  { id: "tableaux", label: "Tableaux électriques" },
  { id: "eclairage", label: "Éclairage LED & Moderne" },
  { id: "reseaux", label: "Installation Réseaux" },
  { id: "noel", label: "Décoration de Noël" },
];

const galleryImages = [
  // Tableaux électriques
  {
    id: 1,
    title: "Tableau électrique RGIE",
    category: "tableaux",
    categoryLabel: "Tableaux électriques",
    image: tableauRgie,
  },
  {
    id: 7,
    title: "Tableau ABB neuf",
    category: "tableaux",
    categoryLabel: "Tableaux électriques",
    image: tableauAbbOuvert,
  },
  {
    id: 8,
    title: "Tableau vitré 3x240V",
    category: "tableaux",
    categoryLabel: "Tableaux électriques",
    image: tableauVitreCe,
  },
  {
    id: 9,
    title: "Tableau complet câblé",
    category: "tableaux",
    categoryLabel: "Tableaux électriques",
    image: tableauGrandCablage,
  },
  {
    id: 10,
    title: "Tableau avec bornier de terre",
    category: "tableaux",
    categoryLabel: "Tableaux électriques",
    image: tableauBornierTerre,
  },
  {
    id: 11,
    title: "Tableau compact résidentiel",
    category: "tableaux",
    categoryLabel: "Tableaux électriques",
    image: tableauCompact,
  },
  {
    id: 12,
    title: "Tableau Schneider",
    category: "tableaux",
    categoryLabel: "Tableaux électriques",
    image: tableauSchneider,
  },
  {
    id: 13,
    title: "Tableau vitré 3x400V+N",
    category: "tableaux",
    categoryLabel: "Tableaux électriques",
    image: tableauVitre400v,
  },
  {
    id: 14,
    title: "Tableau Schneider ouvert",
    category: "tableaux",
    categoryLabel: "Tableaux électriques",
    image: tableauSchneiderOuvert,
  },
  // Éclairage LED & Moderne
  {
    id: 2,
    title: "Installation complète",
    category: "eclairage",
    categoryLabel: "Éclairage LED",
    image: installationComplete,
  },
  {
    id: 4,
    title: "Prise de sol design",
    category: "eclairage",
    categoryLabel: "Éclairage LED",
    image: priseSolDesign,
  },
  {
    id: 5,
    title: "Prise étanche intégrée",
    category: "eclairage",
    categoryLabel: "Éclairage LED",
    image: priseEtancheBriques,
  },
  // Installation Réseaux
  {
    id: 3,
    title: "Visiophone extérieur",
    category: "reseaux",
    categoryLabel: "Installation Réseaux",
    image: visiophonieExterieur,
  },
  {
    id: 6,
    title: "Installation réseau",
    category: "reseaux",
    categoryLabel: "Installation Réseaux",
    image: switchReseau,
  },
  // Décoration de Noël
  {
    id: 15,
    title: "Illuminations de rue",
    category: "noel",
    categoryLabel: "Décoration de Noël",
    image: illuminationsRue,
  },
  {
    id: 16,
    title: "Décoration chalet festif",
    category: "noel",
    categoryLabel: "Décoration de Noël",
    image: chaletNoel,
  },
  {
    id: 17,
    title: "Sapin géant centre commercial",
    category: "noel",
    categoryLabel: "Décoration de Noël",
    image: centreCommercialSapin,
  },
  {
    id: 18,
    title: "Calendrier de l'Avent lumineux",
    category: "noel",
    categoryLabel: "Décoration de Noël",
    image: calendrierAvent,
  },
  {
    id: 19,
    title: "Grande roue de Noël",
    category: "noel",
    categoryLabel: "Décoration de Noël",
    image: grandeRoueNoel,
  },
  {
    id: 20,
    title: "Sapin et décor féerique",
    category: "noel",
    categoryLabel: "Décoration de Noël",
    image: sapinGeant,
  },
  {
    id: 21,
    title: "Étoiles suspendues",
    category: "noel",
    categoryLabel: "Décoration de Noël",
    image: etoilesPlafond,
  },
  {
    id: 22,
    title: "Guirlande bleue festive",
    category: "noel",
    categoryLabel: "Décoration de Noël",
    image: guirlandeBleu,
  },
  {
    id: 23,
    title: "Lumières de façade",
    category: "noel",
    categoryLabel: "Décoration de Noël",
    image: lumieresFacade,
  },
  {
    id: 24,
    title: "Décor de vitrine",
    category: "noel",
    categoryLabel: "Décoration de Noël",
    image: decorVitrine,
  },
  {
    id: 25,
    title: "Sapin lumineux extérieur",
    category: "noel",
    categoryLabel: "Décoration de Noël",
    image: sapinLumineux,
  },
  {
    id: 26,
    title: "Décoration extérieure",
    category: "noel",
    categoryLabel: "Décoration de Noël",
    image: decorationExterieure,
  },
  {
    id: 27,
    title: "Illumination de bâtiment",
    category: "noel",
    categoryLabel: "Décoration de Noël",
    image: illuminationBatiment,
  },
  {
    id: 28,
    title: "Lumières de nuit",
    category: "noel",
    categoryLabel: "Décoration de Noël",
    image: lumieresNuit,
  },
  {
    id: 29,
    title: "Guirlande LED moderne",
    category: "noel",
    categoryLabel: "Décoration de Noël",
    image: guirlandeLed,
  },
  {
    id: 30,
    title: "Décoration de rue festive",
    category: "noel",
    categoryLabel: "Décoration de Noël",
    image: decorationRue,
  },
  {
    id: 31,
    title: "Arche lumineuse",
    category: "noel",
    categoryLabel: "Décoration de Noël",
    image: archeLumineuse,
  },
];

const GallerySection = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

  const filteredImages = activeCategory === "all" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === activeCategory);

  const selectedImageData = galleryImages.find(img => img.id === selectedImage);

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

        {/* Category Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.id
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-card text-card-foreground border border-border hover:border-primary/50"
              }`}
            >
              {cat.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Gallery Grid */}
        <motion.div 
          layout
          className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredImages.map((image, index) => (
              <GalleryItem 
                key={image.id}
                image={image}
                index={index}
                onClick={() => setSelectedImage(image.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && selectedImageData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl p-4 md:p-6"
            onClick={() => setSelectedImage(null)}
          >
            <motion.button 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-card-foreground hover:text-primary transition-colors z-10"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </motion.button>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="max-w-5xl w-full max-h-[85vh] rounded-[2rem] overflow-hidden bg-card border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedImageData.image} 
                alt={selectedImageData.title}
                className="w-full h-full object-contain max-h-[70vh]"
              />
              <div className="p-6 border-t border-border">
                <p className="text-card-foreground font-display font-bold text-xl mb-1">
                  {selectedImageData.title}
                </p>
                <p className="text-primary">
                  {selectedImageData.categoryLabel}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

interface GalleryItemProps {
  image: typeof galleryImages[0];
  index: number;
  onClick: () => void;
}

const GalleryItem = ({ image, index, onClick }: GalleryItemProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ 
        scale: 1.03,
        rotateY: 5,
        rotateX: -5,
        transition: { duration: 0.3 }
      }}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
      className="relative aspect-square rounded-[2rem] overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* Actual image */}
      <img 
        src={image.image} 
        alt={image.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      
      {/* Overlay with title */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
        <p className="text-foreground font-display font-bold text-lg mb-1">{image.title}</p>
        <p className="text-primary text-sm">{image.categoryLabel}</p>
      </div>
      
      {/* Zoom icon */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.5 }}
        whileHover={{ opacity: 1, scale: 1 }}
      >
        <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300">
          <ZoomIn className="w-5 h-5" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GallerySection;
