import { useState, useRef } from "react";
import { X, ZoomIn } from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";

// Import gallery images
import tableauRgie from "@/assets/gallery/tableau-rgie.jpg";
import installationComplete from "@/assets/gallery/installation-complete.jpg";
import visiophonieExterieur from "@/assets/gallery/visiophone-exterieur.jpg";
import priseSolDesign from "@/assets/gallery/prise-sol-design.jpg";
import priseEtancheBriques from "@/assets/gallery/prise-etanche-briques.jpg";
import switchReseau from "@/assets/gallery/switch-reseau.jpg";

const galleryImages = [
  {
    id: 1,
    title: "Tableau électrique RGIE",
    category: "Conformité",
    image: tableauRgie,
  },
  {
    id: 2,
    title: "Installation complète",
    category: "Neuf",
    image: installationComplete,
  },
  {
    id: 3,
    title: "Visiophone extérieur",
    category: "Domotique",
    image: visiophonieExterieur,
  },
  {
    id: 4,
    title: "Prise de sol design",
    category: "Finitions",
    image: priseSolDesign,
  },
  {
    id: 5,
    title: "Prise étanche intégrée",
    category: "Extérieur",
    image: priseEtancheBriques,
  },
  {
    id: 6,
    title: "Installation réseau",
    category: "Technique",
    image: switchReseau,
  },
];

const GallerySection = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

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
        <div ref={headerRef} className="text-center mb-16 md:mb-20">
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

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {galleryImages.map((image, index) => (
            <GalleryItem 
              key={image.id}
              image={image}
              index={index}
              onClick={() => setSelectedImage(image.id)}
            />
          ))}
        </div>
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
              className="absolute top-4 right-4 md:top-6 md:right-6 w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:text-primary transition-colors z-10"
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
                <p className="text-foreground font-display font-bold text-xl mb-1">
                  {selectedImageData.title}
                </p>
                <p className="text-primary">
                  {selectedImageData.category}
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
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
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
        <p className="text-primary text-sm">{image.category}</p>
      </div>
      
      {/* Zoom icon */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.5 }}
        whileHover={{ opacity: 1, scale: 1 }}
      >
        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300">
          <ZoomIn className="w-5 h-5" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GallerySection;
