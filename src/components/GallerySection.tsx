import { useState } from "react";
import { X, ZoomIn } from "lucide-react";

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

  const selectedImageData = galleryImages.find(img => img.id === selectedImage);

  return (
    <section id="realisations" className="py-24 md:py-32 bg-background relative">
      {/* Background accent */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
      
      <div className="container mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-16 md:mb-20">
          <span className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-sm font-medium rounded-full mb-6 opacity-0 animate-fade-up">
            Nos Réalisations
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 opacity-0 animate-fade-up animation-delay-100">
            La propreté{" "}
            <span className="text-gradient-copper">comme signature</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg opacity-0 animate-fade-up animation-delay-200">
            Chaque câble a sa place, chaque connexion est parfaite. Découvrez notre travail minutieux.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {galleryImages.map((image, index) => (
            <div
              key={image.id}
              className="relative aspect-square rounded-[2rem] overflow-hidden cursor-pointer group opacity-0 animate-scale-in"
              style={{ animationDelay: `${300 + index * 100}ms` }}
              onClick={() => setSelectedImage(image.id)}
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
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300">
                  <ZoomIn className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && selectedImageData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl p-4 md:p-6"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 md:top-6 md:right-6 w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:text-primary transition-colors z-10"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          
          <div 
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
          </div>
        </div>
      )}
    </section>
  );
};

export default GallerySection;
