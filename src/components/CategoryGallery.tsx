import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GalleryCategory } from "@/data/galleryData";

interface CategoryGalleryProps {
  category: GalleryCategory;
}

const CategoryGallery = ({ category }: CategoryGalleryProps) => {
  const [lightboxImage, setLightboxImage] = useState<{ image: string; title: string; index: number } | null>(null);

  const handleImageClick = (image: string, title: string, index: number) => {
    setLightboxImage({ image, title, index });
  };

  const handleCloseLightbox = () => {
    setLightboxImage(null);
  };

  const handlePrevImage = () => {
    if (lightboxImage) {
      const newIndex = lightboxImage.index === 0 
        ? category.images.length - 1 
        : lightboxImage.index - 1;
      const img = category.images[newIndex];
      setLightboxImage({ image: img.image, title: img.title, index: newIndex });
    }
  };

  const handleNextImage = () => {
    if (lightboxImage) {
      const newIndex = lightboxImage.index === category.images.length - 1 
        ? 0 
        : lightboxImage.index + 1;
      const img = category.images[newIndex];
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
  }, [lightboxImage]);

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {category.images.map((img, index) => (
          <motion.div
            key={img.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-card"
            onClick={() => handleImageClick(img.image, img.title, index)}
          >
            <img 
              src={img.image} 
              alt={img.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-foreground text-sm font-medium line-clamp-2">{img.title}</p>
              </div>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center">
                <Images className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-background/98 backdrop-blur-xl flex items-center justify-center"
            onClick={handleCloseLightbox}
          >
            {/* Close button */}
            <motion.button 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-card-foreground hover:text-primary transition-colors z-10"
              onClick={handleCloseLightbox}
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Navigation arrows */}
            <motion.button 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute left-4 md:left-8 w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-card-foreground hover:text-primary hover:border-primary transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>

            <motion.button 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute right-4 md:right-8 w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-card-foreground hover:text-primary hover:border-primary transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>

            {/* Image */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={lightboxImage.image} 
                alt={lightboxImage.title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
              />
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 text-center"
              >
                <p className="text-foreground font-medium text-lg">{lightboxImage.title}</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {lightboxImage.index + 1} / {category.images.length}
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CategoryGallery;
