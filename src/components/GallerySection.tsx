import { useState } from "react";
import { X, ZoomIn } from "lucide-react";

const galleryImages = [
  {
    id: 1,
    title: "Tableau électrique RGIE",
    category: "Conformité",
    placeholder: "bg-gradient-to-br from-secondary to-muted",
  },
  {
    id: 2,
    title: "Câblage propre et organisé",
    category: "Installation",
    placeholder: "bg-gradient-to-br from-muted to-secondary",
  },
  {
    id: 3,
    title: "Éclairage LED cuisine",
    category: "Rénovation",
    placeholder: "bg-gradient-to-br from-primary/20 to-secondary",
  },
  {
    id: 4,
    title: "Borne de recharge",
    category: "Mobilité",
    placeholder: "bg-gradient-to-br from-secondary to-primary/20",
  },
  {
    id: 5,
    title: "Dépannage tableau",
    category: "Urgence",
    placeholder: "bg-gradient-to-br from-muted to-primary/10",
  },
  {
    id: 6,
    title: "Installation complète",
    category: "Neuf",
    placeholder: "bg-gradient-to-br from-primary/10 to-muted",
  },
];

const GallerySection = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

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
              className={`relative aspect-square rounded-[2rem] overflow-hidden cursor-pointer group opacity-0 animate-scale-in ${image.placeholder}`}
              style={{ animationDelay: `${300 + index * 100}ms` }}
              onClick={() => setSelectedImage(image.id)}
            >
              {/* Placeholder gradient */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <ZoomIn className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-foreground font-display font-bold text-lg mb-1">{image.title}</p>
                  <p className="text-muted-foreground text-sm">{image.category}</p>
                </div>
              </div>
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-all duration-300 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300">
                  <ZoomIn className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Image note */}
        <p className="text-center text-muted-foreground text-sm mt-8 opacity-0 animate-fade-up" style={{ animationDelay: '900ms' }}>
          📸 Photos de nos chantiers réels - Ajoutez vos propres images pour personnaliser
        </p>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl p-6"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:text-primary transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="max-w-4xl w-full aspect-video rounded-[2rem] bg-gradient-card border border-border flex items-center justify-center">
            <div className="text-center">
              <p className="text-foreground font-display font-bold text-2xl mb-2">
                {galleryImages.find(img => img.id === selectedImage)?.title}
              </p>
              <p className="text-muted-foreground">
                Remplacez par vos photos réelles
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GallerySection;
