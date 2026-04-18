import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Phone, Mail, CheckCircle, AlertCircle } from "lucide-react";
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
import { motion, useInView, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const projectTypes = [
  "Dépannage urgent",
  "Mise en conformité RGIE",
  "Rénovation électrique",
  "Installation neuve",
  "Borne de recharge",
  "Autre",
];

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  projectType?: string;
  message?: string;
}

const ContactSection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    projectType: "",
    message: "",
    wantsCallback: false,
    honeypot: "", // Hidden anti-spam field
  });

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const isLeftInView = useInView(leftRef, { once: true, margin: "-100px" });
  const isRightInView = useInView(rightRef, { once: true, margin: "-100px" });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    } else if (formData.name.length > 100) {
      newErrors.name = "Le nom est trop long (max 100 caractères)";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "L'adresse email n'est pas valide";
    } else if (formData.email.length > 255) {
      newErrors.email = "L'email est trop long";
    }

    // Phone validation (optional but if provided, should be reasonable)
    if (formData.phone && formData.phone.length > 30) {
      newErrors.phone = "Le numéro de téléphone est trop long";
    }

    // Message validation
    if (formData.message && formData.message.length > 5000) {
      newErrors.message = "Le message est trop long (max 5000 caractères)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset status
    setSubmitStatus('idle');
    
    // Validate form
    if (!validateForm()) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez corriger les erreurs dans le formulaire.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          projectType: formData.projectType,
          message: formData.message.trim(),
          wantsCallback: formData.wantsCallback,
          honeypot: formData.honeypot, // Pass honeypot field
        },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Erreur lors de l'envoi");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Fire Google Ads conversion event before redirecting
      if (typeof window.gtag === "function") {
        window.gtag("event", "conversion", {
          send_to: "AW-CONVERSION_ID/CONVERSION_LABEL", // Replace with your actual conversion ID and label
        });
      }

      // Redirect to thank you page
      navigate("/merci");

    } catch (error: any) {
      console.error("Error sending contact form:", error);
      setSubmitStatus('error');
      
      // Check for rate limit error
      if (error.message?.includes("Trop de demandes")) {
        toast({
          title: "⏳ Trop de demandes",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Erreur d'envoi",
          description: "Veuillez réessayer ou appelez-nous directement au 0485 75 52 27.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitStatus('idle');
    setErrors({});
  };

  return (
    <section id="contact" className="py-24 md:py-32 bg-background relative overflow-hidden">
      {/* Background accents */}
      <motion.div 
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]"
        animate={{ 
          scale: [1, 1.2, 1],
          x: [-50, 50, -50]
        }}
        transition={{ 
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="container mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left column - Info */}
          <div ref={leftRef}>
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={isLeftInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-sm font-medium rounded-full mb-6"
            >
              Contact
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              animate={isLeftInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
            >
              Demandez votre{" "}
              <span className="text-gradient-copper">devis gratuit</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={isLeftInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-muted-foreground mb-10 text-lg leading-relaxed"
            >
              Décrivez-nous votre projet et recevez un devis détaillé sous 48h. Sans engagement.
            </motion.p>

            {/* Contact cards */}
            <div className="space-y-4">
              <motion.a
                initial={{ opacity: 0, x: -30 }}
                animate={isLeftInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ x: 5, scale: 1.02 }}
                href="tel:+32485755227"
                className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-lg shadow-black/5 hover:shadow-xl hover:border-primary/30 transition-all duration-300 group block"
              >
                <motion.div 
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <Phone className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Appelez-nous</p>
                  <p className="font-display text-xl font-bold text-card-foreground">
                    0485 75 52 27
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bureau : Lun-Ven 8h-18h, Sam 9h-13h — Dépannage urgent 7j/7 24h/24
                  </p>
                </div>
              </motion.a>

              <motion.a
                initial={{ opacity: 0, x: -30 }}
                animate={isLeftInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                whileHover={{ x: 5, scale: 1.02 }}
                href="mailto:cuivre.electrique@gmail.com"
                className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-lg shadow-black/5 hover:shadow-xl hover:border-primary/30 transition-all duration-300 group block"
              >
                <motion.div 
                  className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <Mail className="w-6 h-6 text-primary" />
                </motion.div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Écrivez-nous</p>
                  <p className="font-display text-lg font-bold text-card-foreground">
                    cuivre.electrique@gmail.com
                  </p>
                </div>
              </motion.a>

              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={isLeftInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="p-5 rounded-2xl bg-card border border-primary/20 shadow-lg shadow-black/5"
              >
                <div className="flex items-start gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  </motion.div>
                  <div>
                    <p className="font-medium text-card-foreground mb-1">Réponse rapide garantie</p>
                    <p className="text-sm text-muted-foreground">
                      Nous répondons à toutes les demandes sous 24-48h ouvrées.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right column - Form */}
          <motion.div 
            ref={rightRef}
            initial={{ opacity: 0, x: 50 }}
            animate={isRightInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-6 md:p-8 rounded-3xl bg-card border border-border/50 shadow-xl shadow-black/10"
          >
            <AnimatePresence mode="wait">
              {submitStatus === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6"
                  >
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">Merci pour votre demande !</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    Votre message a bien été envoyé. Nous vous recontacterons dans les <strong>24 à 48 heures</strong>.
                  </p>
                  <Button onClick={resetForm} variant="outline">
                    Envoyer une autre demande
                  </Button>
                </motion.div>
              ) : submitStatus === 'error' ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6"
                  >
                    <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">Erreur d'envoi</h3>
                  <p className="text-muted-foreground mb-4 max-w-sm">
                    Une erreur est survenue lors de l'envoi de votre message.
                  </p>
                  <p className="text-foreground font-medium mb-6">
                    Appelez-nous directement au <a href="tel:+32485755227" className="text-primary hover:underline">0485 75 52 27</a>
                  </p>
                  <Button onClick={resetForm} variant="outline">
                    Réessayer
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {/* Honeypot field - hidden from users, visible to bots */}
                  <input
                    type="text"
                    name="website"
                    value={formData.honeypot}
                    onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                    tabIndex={-1}
                    autoComplete="off"
                    style={{ 
                      position: 'absolute', 
                      left: '-9999px', 
                      opacity: 0, 
                      pointerEvents: 'none' 
                    }}
                    aria-hidden="true"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-card-foreground mb-2"
                      >
                        Nom complet *
                      </label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Jean Dupont"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: undefined });
                        }}
                        required
                        maxLength={100}
                        className={`h-12 bg-background border-border rounded-xl focus:border-primary text-foreground placeholder:text-muted-foreground ${errors.name ? 'border-red-500' : ''}`}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-card-foreground mb-2"
                      >
                        Email *
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="jean@exemple.be"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        required
                        maxLength={255}
                        className={`h-12 bg-background border-border rounded-xl focus:border-primary text-foreground placeholder:text-muted-foreground ${errors.email ? 'border-red-500' : ''}`}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-card-foreground mb-2"
                      >
                        Téléphone
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+32 XXX XX XX XX"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (errors.phone) setErrors({ ...errors, phone: undefined });
                        }}
                        maxLength={30}
                        className={`h-12 bg-background border-border rounded-xl focus:border-primary text-foreground placeholder:text-muted-foreground ${errors.phone ? 'border-red-500' : ''}`}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="projectType"
                        className="block text-sm font-medium text-card-foreground mb-2"
                      >
                        Type de travaux
                      </label>
                      <Select
                        value={formData.projectType}
                        onValueChange={(value) =>
                          setFormData({ ...formData, projectType: value })
                        }
                      >
                        <SelectTrigger className="h-12 bg-background border-border rounded-xl text-foreground">
                          <SelectValue placeholder="Sélectionnez..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-border rounded-xl">
                          {projectTypes.map((type) => (
                            <SelectItem key={type} value={type} className="text-card-foreground">
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
                      className="block text-sm font-medium text-card-foreground mb-2"
                    >
                      Message
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Décrivez votre projet..."
                      rows={4}
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        if (errors.message) setErrors({ ...errors, message: undefined });
                      }}
                      maxLength={5000}
                      className={`bg-background border-border rounded-xl resize-none focus:border-primary text-foreground placeholder:text-muted-foreground ${errors.message ? 'border-red-500' : ''}`}
                    />
                    {errors.message && (
                      <p className="text-red-500 text-xs mt-1">{errors.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {formData.message.length}/5000
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="callback"
                      checked={formData.wantsCallback}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, wantsCallback: checked as boolean })
                      }
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor="callback"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Je souhaite être rappelé(e)
                    </label>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      variant="copper"
                      size="xl"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Envoyer ma demande
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;