import { useState } from "react";
import { Send, Phone, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const projectTypes = [
  "Dépannage urgent",
  "Mise en conformité RGIE",
  "Rénovation électrique",
  "Installation neuve",
  "Borne de recharge",
  "Autre",
];

const ContactSection = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    projectType: "",
    message: "",
    wantsCallback: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Demande envoyée !",
      description: "Nous vous recontacterons dans les plus brefs délais.",
    });

    setFormData({
      name: "",
      email: "",
      phone: "",
      projectType: "",
      message: "",
      wantsCallback: false,
    });
    setIsSubmitting(false);
  };

  return (
    <section id="contact" className="py-24 md:py-32 bg-background relative">
      {/* Background accents */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      
      <div className="container mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left column - Info */}
          <div>
            <span className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-sm font-medium rounded-full mb-6 opacity-0 animate-fade-up">
              Contact
            </span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 opacity-0 animate-fade-up animation-delay-100">
              Demandez votre{" "}
              <span className="text-gradient-copper">devis gratuit</span>
            </h2>
            <p className="text-muted-foreground mb-10 text-lg leading-relaxed opacity-0 animate-fade-up animation-delay-200">
              Décrivez-nous votre projet et recevez un devis détaillé sous 48h. Sans engagement.
            </p>

            {/* Contact cards */}
            <div className="space-y-4 opacity-0 animate-fade-up animation-delay-300">
              <a
                href="tel:+32485755227"
                className="bento-card flex items-center gap-4 !p-5 group"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-copper flex items-center justify-center shadow-copper group-hover:shadow-copper-lg transition-shadow">
                  <Phone className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Appelez-nous</p>
                  <p className="font-display text-xl font-bold text-foreground">
                    0485 75 52 27
                  </p>
                </div>
              </a>

              <a
                href="mailto:cuivre.electrique@gmail.com"
                className="bento-card flex items-center gap-4 !p-5 group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Écrivez-nous</p>
                  <p className="font-display text-lg font-bold text-foreground">
                    cuivre.electrique@gmail.com
                  </p>
                </div>
              </a>

              <div className="bento-card !p-5 border-primary/20">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Réponse rapide garantie</p>
                    <p className="text-sm text-muted-foreground">
                      Nous répondons à toutes les demandes sous 24h ouvrées.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Form */}
          <div className="bento-card opacity-0 animate-slide-in-right animation-delay-200">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Nom complet *
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Jean Dupont"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="h-12 bg-muted/50 border-border/50 rounded-xl focus:border-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Email *
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jean@exemple.be"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="h-12 bg-muted/50 border-border/50 rounded-xl focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Téléphone *
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+32 XXX XX XX XX"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                    className="h-12 bg-muted/50 border-border/50 rounded-xl focus:border-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="projectType"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Type de travaux *
                  </label>
                  <Select
                    value={formData.projectType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, projectType: value })
                    }
                    required
                  >
                    <SelectTrigger className="h-12 bg-muted/50 border-border/50 rounded-xl">
                      <SelectValue placeholder="Sélectionnez..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border rounded-xl">
                      {projectTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Décrivez votre projet..."
                  rows={4}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="bg-muted/50 border-border/50 rounded-xl resize-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="callback"
                  checked={formData.wantsCallback}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, wantsCallback: checked as boolean })
                  }
                  className="border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label
                  htmlFor="callback"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Je souhaite être rappelé(e)
                </label>
              </div>

              <Button
                type="submit"
                variant="copper"
                size="xl"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Envoi en cours..."
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Envoyer ma demande
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
