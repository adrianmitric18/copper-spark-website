import { useState } from "react";
import { Send, Phone, CheckCircle } from "lucide-react";
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
  "Installation électrique",
  "Rénovation électrique",
  "Mise en conformité RGIE",
  "Photovoltaïque",
  "Borne de recharge",
  "Dépannage",
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
    <section id="contact" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left column - Info */}
          <div>
            <span className="inline-block px-4 py-1.5 bg-accent text-accent-foreground text-sm font-medium rounded-full mb-4">
              Contact
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Demandez votre{" "}
              <span className="text-gradient-copper">devis gratuit</span>
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Décrivez-nous votre projet et recevez un devis détaillé sous 48h.
              Sans engagement.
            </p>

            {/* Quick contact */}
            <div className="space-y-4">
              <a
                href="tel:+32123456789"
                className="flex items-center gap-4 p-4 bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-copper flex items-center justify-center shadow-copper group-hover:shadow-copper-lg transition-shadow">
                  <Phone className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Appelez-nous</p>
                  <p className="font-display font-bold text-foreground">
                    +32 123 456 789
                  </p>
                </div>
              </a>

              <div className="p-4 bg-accent/50 rounded-xl border border-primary/10">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Réponse rapide</p>
                    <p className="text-sm text-muted-foreground">
                      Nous répondons à toutes les demandes sous 24h ouvrées.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Form */}
          <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-foreground mb-1.5"
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
                    className="h-11"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground mb-1.5"
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
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-foreground mb-1.5"
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
                    className="h-11"
                  />
                </div>
                <div>
                  <label
                    htmlFor="projectType"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Type de projet *
                  </label>
                  <Select
                    value={formData.projectType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, projectType: value })
                    }
                    required
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Sélectionnez..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border">
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
                  className="block text-sm font-medium text-foreground mb-1.5"
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
                  className="resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="callback"
                  checked={formData.wantsCallback}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, wantsCallback: checked as boolean })
                  }
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
                size="lg"
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
