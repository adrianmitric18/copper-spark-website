import { useEffect, useRef, useState } from "react";

import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Phone, Mail, Loader2, Copy, Star, Save, Trash2, CalendarPlus, MessageCircle, Smartphone, ArrowLeft, Hammer, Navigation, Mic, MicOff, FileText } from "lucide-react";
import { toast } from "sonner";
import RendezVousForm, { type RdvFormValues } from "@/components/admin/RendezVousForm";
import RendezVousCard from "@/components/admin/RendezVousCard";
import ChecklistVisite from "@/components/admin/ChecklistVisite";
import InterventionDialog from "@/components/admin/InterventionDialog";
import InterventionCard from "@/components/admin/InterventionCard";
import InterventionSuccessScreen from "@/components/admin/InterventionSuccessScreen";
import InterventionAnnulationDialog from "@/components/admin/InterventionAnnulationDialog";
import {
  createIntervention,
  updateIntervention,
  updateInterventionStatut,
  fetchInterventionsForLead,
  transformInterventionToProject,
  type Intervention,
  type InterventionFormValues,
  type TypeIntervention,
} from "@/lib/admin/interventions";
import {
  sendRdvConfirmationEmails,
  sendRdvModificationEmail,
  sendRdvAnnulationEmail,
  type LeadInfo,
} from "@/lib/rdv/emailjs";
import type { RendezVous, TypeVisite } from "@/lib/rdv/constants";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import {
  fetchLeadById,
  fetchActiveRdvForLead,
  fetchLeadPhotoSignedUrls,
  updateLeadStatus,
  updateLeadNotes,
  setLeadDevisEnvoye,
  deleteLeadWithPhotos,
} from "@/lib/admin/queries";
import {
  type Lead,
  LEAD_STATUSES,
  leadSourceLabel,
} from "@/lib/admin/types";
import {
  smsBienRecu,
  buildSmsHref,
  buildWhatsappHref,
  smsTemplateRelance1,
  whatsappTemplateRelance1,
  smsTemplateConfirmation,
  whatsappTemplateConfirmation,
  COMPANY,
  type RelanceDevisPayload,
  type ConfirmationRdvPayload,
} from "@/lib/admin/message-templates";
import { formatHeure } from "@/lib/rdv/formatters";
import AdminShell from "@/admin/layout/AdminShell";
import AdminLoading from "@/components/admin/AdminLoading";
import CollapsibleCard from "@/components/admin/CollapsibleCard";
import ErrorBoundary from "@/components/admin/ErrorBoundary";

const cleanPhoneForWhatsapp = (phone: string) => phone.replace(/[^\d]/g, "").replace(/^0/, "32").replace(/^0032/, "32");
const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] || name;
const formatRdvDateShort = (dateStr: string) =>
  new Date(`${dateStr}T12:00:00`).toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });
const daysUntilRdv = (dateStr: string) => {
  const today = new Date();
  const todayMidday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  const [year, month, day] = dateStr.split("-").map(Number);
  const rdvDay = new Date(year, month - 1, day, 12);
  return Math.round((rdvDay.getTime() - todayMidday.getTime()) / 86400000);
};
// Tier 1 / Phase 3 — date du jour (YYYY-MM-DD, local) pour stamper devis_envoye_at.
const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
// Affichage d'une date seule (colonne `date`) en français.
const formatDevisDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" });

// Phase 2.2 — réponses rapides : messages types pré-remplis (SMS/WhatsApp).
// Le client final tape juste « Envoyer ». Signature commune Le Cuivre Électrique.
const QUICK_REPLIES: { label: string; body: (firstName: string) => string }[] = [
  { label: "Je vous rappelle", body: (n) => `Bonjour ${n}, je vous rappelle très vite au sujet de votre demande. Adrian — Le Cuivre Électrique` },
  { label: "Indispo cette semaine", body: (n) => `Bonjour ${n}, je suis complet cette semaine, mais je reviens vers vous pour caler une date au plus tôt. Adrian — Le Cuivre Électrique` },
  { label: "En route, j'arrive", body: (n) => `Bonjour ${n}, je suis en route, j'arrive d'ici peu. Adrian — Le Cuivre Électrique` },
  { label: "Bien reçu", body: (n) => smsBienRecu(n) },
];

// ── Section « Messages » (incréments 1/3 + 2/3) ─────────────────────────────
// Catalogue de messages prêts à l'emploi, envoyables en 1 tap (SMS / WhatsApp).
// Le corps peut contenir des {{variables}} remplies depuis la fiche (fillTemplate).
// Réutilise les templates partagés (smsBienRecu, relances, confirmation) de
// message-templates. Contexte = lead + RDV actif lié (pour date/heure/adresse).

// Contexte de remplissage : la fiche + son RDV actif (null si aucun).
interface MsgCtx {
  lead: Lead;
  rdv: RendezVous | null;
}

// Remplace {{clé}} par sa valeur ; laisse {{clé}} tel quel si inconnue
// (volontairement visible → repère une variable manquante en test).
const fillTemplate = (tpl: string, vars: Record<string, string>): string =>
  tpl.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, k: string) => vars[k.trim()] ?? `{{${k.trim()}}}`);

// Adresse : champ libre `address` en priorité, sinon recomposée depuis les
// champs structurés (rue/numéro/CP/commune). Vide si rien d'exploitable.
const composeAddress = (lead: Lead): string => {
  const struct = [
    [lead.rue, lead.numero].filter(Boolean).join(" "),
    [lead.code_postal, lead.commune].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  return (lead.address?.trim() || struct || "").trim();
};

// Variables disponibles, depuis les données de la fiche + le RDV lié.
// (date_intervention/heure restent vides s'il n'y a pas de RDV.)
const buildMessageVars = ({ lead, rdv }: MsgCtx): Record<string, string> => ({
  "prénom": firstNameOf(lead.name),
  "objet": lead.services?.[0] || "votre projet",
  "date_devis": lead.devis_envoye_at ? formatRdvDateShort(lead.devis_envoye_at) : "",
  "adresse": composeAddress(lead),
  "date_intervention": rdv ? formatRdvDateShort(rdv.date_rdv) : "",
  "heure": rdv ? formatHeure(rdv.heure_rdv) : "",
  "lien_avis": COMPANY.reviewUrl,
});

interface FicheMessage {
  id: string;
  title: string; // titre court, repérable au coup d'œil
  moment: string; // quand l'utiliser
  // Texte final (variables déjà remplies) pour chaque canal.
  build: (ctx: MsgCtx, vars: Record<string, string>) => { sms: string; wa: string };
  // Affiché seulement si pertinent (sinon masqué). Absent = toujours affiché.
  show?: (ctx: MsgCtx) => boolean;
}

const FICHE_MESSAGES: FicheMessage[] = [
  {
    id: "recu-rappel-demain",
    title: "Bien reçu — rappel demain",
    moment: "Nouveau lead, le jour même",
    build: (_ctx, vars) => {
      const txt = fillTemplate(
        "Bonjour {{prénom}} 👋 C'est Adrian, du Cuivre Électrique. J'ai bien reçu votre demande, merci ! Je vous rappelle demain pour qu'on en parle 📞 À demain ! Adrian",
        vars,
      );
      return { sms: txt, wa: txt };
    },
  },
  {
    id: "bien-recu",
    title: "Bien reçu",
    moment: "Accusé de réception",
    build: (_ctx, vars) => {
      const txt = smsBienRecu(vars["prénom"]);
      return { sms: txt, wa: txt };
    },
  },
  {
    id: "confirmation-rdv",
    title: "Confirmation RDV",
    moment: "Avant la visite / intervention",
    show: ({ rdv }) => Boolean(rdv),
    build: ({ lead, rdv }) => {
      if (!rdv) return { sms: "", wa: "" };
      const payload: ConfirmationRdvPayload = {
        clientName: lead.name,
        dateIso: rdv.date_rdv,
        heure: rdv.heure_rdv.slice(0, 5),
        typeVisite: rdv.type_visite as TypeVisite,
        dureeMinutes: rdv.duree_minutes,
        address: composeAddress(lead) || undefined,
        delaiAppelMinutes: null,
      };
      return {
        sms: smsTemplateConfirmation(payload),
        wa: whatsappTemplateConfirmation(payload),
      };
    },
  },
  {
    id: "demarrage-chantier",
    title: "Démarrage chantier",
    moment: "Acompte reçu, le chantier démarre",
    show: ({ rdv }) => Boolean(rdv),
    build: (_ctx, vars) => {
      const txt = fillTemplate(
        `Bonjour {{prénom}} 👋 C'est Adrian, du Cuivre Électrique.

Bonne nouvelle : votre acompte est bien arrivé, merci à vous ! 🙏 Comme convenu au téléphone, je vous confirme la date qu'on a fixée ensemble :
🗓️ {{date_intervention}} à partir de {{heure}}
📍 {{adresse}}

Pour que tout roule le jour J :
🅿️ un accès dégagé et une place où me garer à proximité
⚡ je devrai couper le courant par moments — pensez au frigo, au congélateur et au matériel sensible

Je m'occupe du reste. À très bientôt ! Adrian`,
        vars,
      );
      return { sms: txt, wa: txt };
    },
  },
  {
    id: "relance-devis",
    title: "Relance devis",
    moment: "Devis sans réponse",
    show: ({ lead }) => Boolean(lead.devis_envoye_at),
    build: ({ lead }, vars) => {
      const payload: RelanceDevisPayload = {
        clientName: vars["prénom"],
        devisEnvoyeAt: lead.devis_envoye_at as string,
      };
      return { sms: smsTemplateRelance1(payload), wa: whatsappTemplateRelance1(payload) };
    },
  },
  {
    id: "avis-google",
    title: "Avis Google",
    moment: "Chantier fini",
    build: (_ctx, vars) => {
      const txt = fillTemplate(
        `Bonjour {{prénom}} 👋 C'est Adrian. J'espère que tout fonctionne nickel depuis mon passage pour {{objet}}, et que vous êtes content du résultat 😊

Si c'est le cas, j'aurais un petit service à vous demander — 2 minutes, pas plus. Pour un artisan indépendant, un avis Google a une vraie valeur : c'est votre confiance rendue visible, et la plus belle vitrine pour mon travail. ⭐

👉 Le lien direct (ça ouvre la page, vous mettez les étoiles, c'est réglé) :
{{lien_avis}}

Et si vous séchez sur quoi écrire, un mot sur le travail ou le contact suffit.

Si quelque chose ne vous a pas plu, dites-le moi à moi en premier 🙏 — je tiens à ce que vous soyez vraiment content.

Merci de tout cœur ! Adrian`,
        vars,
      );
      return { sms: txt, wa: txt };
    },
  },
];

// Phase 2.5 — dictée vocale (Web Speech API, gratuite, surtout utile sur
// chantier). Types minimaux car l'API n'est pas dans lib.dom par défaut.
interface SpeechAlt { transcript: string }
interface SpeechResult { 0: SpeechAlt; isFinal: boolean }
interface SpeechEvent { resultIndex: number; results: ArrayLike<SpeechResult> }
interface SpeechRecognizer {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
const getRecognizer = (): SpeechRecognizer | null => {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognizer;
    webkitSpeechRecognition?: new () => SpeechRecognizer;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
};
const dictationSupported = (): boolean => {
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
};

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, ready, loading: authLoading } = useAdminGuard();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  // RDV state
  const [rdv, setRdv] = useState<RendezVous | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [submittingRdv, setSubmittingRdv] = useState(false);
  const [cancellingRdv, setCancellingRdv] = useState(false);

  // Interventions (chantiers programmés) — distinct des RDV exploratoires
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [interventionDialogOpen, setInterventionDialogOpen] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState<Intervention | null>(null);
  const [cancellingIntervention, setCancellingIntervention] = useState<Intervention | null>(null);
  const [submittingIntervention, setSubmittingIntervention] = useState(false);
  const [submittingAnnulation, setSubmittingAnnulation] = useState(false);
  const [lastCreatedIntervention, setLastCreatedIntervention] = useState<Intervention | null>(null);
  const [lastUpdatedIntervention, setLastUpdatedIntervention] = useState<Intervention | null>(null);

  useEffect(() => {
    if (!ready || !id) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const [loadedLead, loadedRdv, loadedInterventions] = await Promise.all([
          fetchLeadById(id),
          fetchActiveRdvForLead(id),
          fetchInterventionsForLead(id),
        ]);

        if (cancelled) return;

        if (!loadedLead) {
          toast.error("Lead introuvable");
          navigate("/admin");
          return;
        }

        setLead(loadedLead);
        setNotes(loadedLead.notes_internes || loadedLead.notes || "");
        setRdv((loadedRdv as RendezVous | null) ?? null);
        setInterventions(loadedInterventions);

        if (loadedLead.photo_urls?.length) {
          const urls = await fetchLeadPhotoSignedUrls(loadedLead.photo_urls);
          if (!cancelled) setPhotoUrls(urls);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "chargement impossible";
        toast.error("Erreur : " + msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, ready, user?.id, navigate]);

  useEffect(() => {
    if (lead) document.title = `${lead.name} – Admin`;
  }, [lead]);

  // Phase 1.3 — la barre d'actions « Caler RDV » est collée en haut, mais le
  // formulaire est rendu tout en bas de la page. Sans scroll, le clic ouvre le
  // formulaire hors écran et donne l'impression que rien ne se passe. On amène
  // donc la carte du formulaire dans le viewport dès qu'on l'affiche.
  const rdvSectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (showForm) {
      rdvSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm]);

  // T7 — arrivée depuis « Caler RDV » du cockpit (carte Leads à rappeler) :
  // ?rdv=1 ouvre directement le formulaire. On n'ouvre que si le lead est
  // chargé et n'a pas déjà de RDV actif (sinon on garde la carte RDV existante),
  // puis on nettoie l'URL pour ne pas re-déclencher après une fermeture.
  const rdvParamHandled = useRef(false);
  useEffect(() => {
    if (rdvParamHandled.current) return;
    if (loading || !lead) return;
    if (searchParams.get("rdv") !== "1") return;
    rdvParamHandled.current = true;
    if (!rdv) {
      setEditing(false);
      setShowForm(true);
    }
    searchParams.delete("rdv");
    setSearchParams(searchParams, { replace: true });
  }, [loading, lead, rdv, searchParams, setSearchParams]);

  const updateStatus = async (newStatus: string) => {
    if (!lead) return;
    try {
      // Tier 1 / Phase 3 — au passage en "devis envoyé", on stampe la date
      // d'envoi si elle n'existe pas encore : c'est elle qui arme les relances
      // J+3/7/14 (carte cockpit). Un seul geste pour Adrian : changer le statut.
      if (newStatus === "devis envoyé" && !lead.devis_envoye_at) {
        const today = todayIso();
        await setLeadDevisEnvoye(lead.id, today);
        setLead({ ...lead, status: newStatus, devis_envoye_at: today });
      } else {
        await updateLeadStatus(lead.id, newStatus);
        setLead({ ...lead, status: newStatus });
      }
      toast.success("Statut mis à jour");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "mise à jour impossible";
      toast.error("Erreur : " + msg);
    }
  };

  // Marque (ou re-marque) le devis comme envoyé aujourd'hui — utile pour
  // backfiller un lead existant ou repartir le compteur de relance après renvoi.
  const markDevisToday = async () => {
    if (!lead) return;
    try {
      const today = todayIso();
      await setLeadDevisEnvoye(lead.id, today);
      setLead({ ...lead, status: "devis envoyé", devis_envoye_at: today });
      toast.success("Devis marqué envoyé aujourd'hui");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "mise à jour impossible";
      toast.error("Erreur : " + msg);
    }
  };

  const saveNotes = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      await updateLeadNotes(lead.id, notes);
      toast.success("Notes enregistrées");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "enregistrement impossible";
      toast.error("Erreur : " + msg);
    } finally {
      setSaving(false);
    }
  };

  const formattedAddress = () => {
    if (!lead) return "";
    const line1 = [lead.rue, lead.numero].filter(Boolean).join(" ");
    const line2 = [lead.code_postal, lead.commune].filter(Boolean).join(" ");
    if (line1 || line2) return [line1, line2].filter(Boolean).join("\n");
    return lead.address || "";
  };

  const copyContact = () => {
    if (!lead) return;
    const text = `${lead.name}\n${lead.phone}\n${lead.email}\n${formattedAddress()}`;
    navigator.clipboard.writeText(text);
    toast.success("Coordonnées copiées");
  };

  const deleteLead = async () => {
    if (!lead) return;
    setDeleting(true);
    try {
      await deleteLeadWithPhotos(lead);
      toast.success("Lead supprimé");
      navigate("/admin");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "suppression impossible";
      toast.error("Erreur : " + msg);
      setDeleting(false);
    }
  };

  const copyReviewSms = () => {
    if (!lead) return;
    const firstName = lead.name.split(" ")[0];
    const sms = `Bonjour ${firstName}, j'espère que tout va bien avec l'installation. Si vous êtes satisfait, un petit avis Google m'aiderait beaucoup : https://g.page/r/CVLZZFVq3KkiEBM/review Merci ! Adrian`;
    navigator.clipboard.writeText(sms);
    toast.success("SMS d'avis copié");
  };

  const communicationMessage = () => {
    if (!lead) return { subject: "", body: "" };
    const firstName = firstNameOf(lead.name);
    const services = lead.services?.join(", ") || "votre demande";
    if (!rdv) {
      return {
        subject: "Votre demande - Le Cuivre Électrique",
        body: `Bonjour ${firstName}, Adrian du Cuivre Électrique. Je reviens vers vous concernant votre demande pour ${services}. Quand seriez-vous disponible pour qu'on organise une visite ?`,
      };
    }
    const diff = daysUntilRdv(rdv.date_rdv);
    const heure = rdv.heure_rdv.slice(0, 5).replace(":", "h");
    if (diff === 0) {
      return {
        subject: "Confirmation de ma visite aujourd'hui",
        body: `Bonjour ${firstName}, je confirme ma visite aujourd'hui à ${heure}. À tout à l'heure !`,
      };
    }
    if (diff === 1) {
      return {
        subject: "Rappel de notre rendez-vous demain",
        body: `Bonjour ${firstName}, petit rappel pour notre rendez-vous demain ${formatRdvDateShort(rdv.date_rdv)} à ${heure}. À très bientôt, Adrian`,
      };
    }
    return {
      subject: "Confirmation de notre rendez-vous",
      body: `Bonjour ${firstName}, je vous confirme notre rendez-vous du ${formatRdvDateShort(rdv.date_rdv)} à ${heure}. À très bientôt, Adrian`,
    };
  };

  const leadInfo = (): LeadInfo | null => lead && {
    id: lead.id, name: lead.name, email: lead.email, phone: lead.phone,
    rue: lead.rue, numero: lead.numero, code_postal: lead.code_postal, commune: lead.commune,
  };

  // Phase 1.6 — un email est "utilisable" pour l'envoi auto seulement s'il est
  // réel : pas vide, pas "Non fourni", pas le placeholder local généré par le
  // RDV rapide (rdv-...@local.cuivre-electrique.com). Sinon on n'envoie pas
  // (ça planterait à la validation) et on bascule sur SMS/WhatsApp.
  const hasUsableEmail = (email: string | null | undefined): boolean => {
    if (!email) return false;
    const e = email.trim().toLowerCase();
    if (!e.includes("@")) return false;
    if (e === "non fourni") return false;
    if (e.endsWith("@local.cuivre-electrique.com")) return false;
    return true;
  };

  // Phase 2.5 — dictée vocale qui alimente les notes internes.
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const [listening, setListening] = useState(false);
  const canDictate = dictationSupported();

  const toggleDictation = () => {
    if (listening) {
      recognizerRef.current?.stop();
      return;
    }
    const rec = getRecognizer();
    if (!rec) {
      toast.error("Dictée non supportée sur ce navigateur");
      return;
    }
    rec.lang = "fr-FR";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let chunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) chunk += e.results[i][0].transcript;
      }
      const clean = chunk.trim();
      if (clean) setNotes((prev) => (prev ? prev.trimEnd() + " " : "") + clean);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognizerRef.current = rec;
    rec.start();
    setListening(true);
  };

  // ==== RDV : créer / modifier / annuler ====
  // Logique métier complexe (3 emails à envoyer côté création, mise à jour
  // du statut du lead en cascade) — laissée inline plutôt qu'extraite dans
  // queries.ts pour garder la lisibilité.
  const handleRdvSubmit = async (values: RdvFormValues) => {
    if (!lead) return;
    const info = leadInfo();
    if (!info) return;
    setSubmittingRdv(true);
    try {
      let saved: RendezVous;
      if (editing && rdv) {
        // Modification
        const { data, error } = await supabase
          .from("rendez_vous")
          .update({
            date_rdv: values.date_rdv,
            heure_rdv: values.heure_rdv,
            duree_minutes: values.duree_minutes,
            type_visite: values.type_visite,
            notes_internes: values.notes_internes || null,
            rappel_envoye_at: null, // reset pour que le nouveau rappel parte
            statut: "confirme",
          })
          .eq("id", rdv.id)
          .select()
          .single();
        if (error) throw error;
        saved = data as RendezVous;
        await sendRdvModificationEmail(info, saved);
        toast.success("RDV modifié, email envoyé au client");
      } else {
        // Création
        const { data, error } = await supabase
          .from("rendez_vous")
          .insert({
            lead_id: lead.id,
            date_rdv: values.date_rdv,
            heure_rdv: values.heure_rdv,
            duree_minutes: values.duree_minutes,
            type_visite: values.type_visite,
            notes_internes: values.notes_internes || null,
          })
          .select()
          .single();
        if (error) throw error;
        saved = data as RendezVous;
        // Phase 1.6 — confirmation unifiée selon le client :
        //  - client web (vrai email) -> envoi auto (email client + mémo Adrian) ;
        //  - client téléphone (email placeholder/absent) -> pas d'envoi auto
        //    (il planterait), on invite à prévenir par SMS/WhatsApp.
        // Dans tous les cas, un échec d'email NE perd PAS le RDV déjà enregistré.
        if (hasUsableEmail(lead.email)) {
          try {
            await sendRdvConfirmationEmails(info, saved);
            toast.success("RDV confirmé — email envoyé au client + mémo pour toi");
          } catch (mailErr: unknown) {
            const m = mailErr instanceof Error ? mailErr.message : "envoi email impossible";
            toast.warning("RDV confirmé, mais l'email n'est pas parti", {
              description: `${m}. Préviens le client par SMS/WhatsApp (boutons plus bas).`,
            });
          }
        } else {
          toast.success("RDV confirmé", {
            description:
              "Pas d'email valide pour ce client — préviens-le par SMS ou WhatsApp (boutons plus bas).",
          });
        }
        await updateLeadStatus(lead.id, "RDV confirmé");
        setLead({ ...lead, status: "RDV confirmé" });
      }
      setRdv(saved);
      setShowForm(false);
      setEditing(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "impossible d'enregistrer le RDV";
      toast.error("Erreur : " + msg);
    } finally {
      setSubmittingRdv(false);
    }
  };

  // ==== Interventions (chantiers programmés) ====
  // Devine un type d'intervention par défaut depuis les services du lead.
  // Mapping volontairement simple — l'admin peut toujours surcharger dans le dialog.
  const guessTypeIntervention = (): TypeIntervention => {
    const services = (lead?.services ?? []).map((s) => s.toLowerCase()).join(" ");
    if (services.includes("rgie") || services.includes("conformit")) return "Inspection RGIE";
    if (services.includes("dépann") || services.includes("urgence")) return "Dépannage";
    if (services.includes("borne") || services.includes("recharge")) return "Installation borne de recharge";
    if (services.includes("photovolta") || services.includes("panneau")) return "Installation panneaux photovoltaïques";
    if (services.includes("rénovation") || services.includes("installation")) return "Visite technique";
    return "Autre";
  };

  const handleInterventionSubmit = async (values: InterventionFormValues) => {
    if (!lead) return;
    setSubmittingIntervention(true);
    try {
      if (editingIntervention) {
        // Mode édition → met à jour + bascule sur écran rectification
        const updated = await updateIntervention({ id: editingIntervention.id, ...values });
        setInterventions((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        setLastUpdatedIntervention(updated);
        setEditingIntervention(null);
        setInterventionDialogOpen(false);
        toast.success("Planning mis à jour", {
          description: "Préviens le client avec le message de rectification.",
        });
      } else {
        // Mode création → écran de confirmation initial
        const created = await createIntervention({ leadId: lead.id, ...values });
        setInterventions((prev) => [created, ...prev]);
        setLastCreatedIntervention(created);
        setInterventionDialogOpen(false);
        toast.success("Chantier programmé", {
          description: `${created.type_intervention} — ${created.date_debut}${created.date_fin !== created.date_debut ? ` → ${created.date_fin}` : ""}`,
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "enregistrement impossible";
      toast.error("Erreur : " + msg);
    } finally {
      setSubmittingIntervention(false);
    }
  };

  const handleEditIntervention = (intervention: Intervention) => {
    setEditingIntervention(intervention);
    setInterventionDialogOpen(true);
  };

  const handleAskCancelIntervention = (intervention: Intervention) => {
    setCancellingIntervention(intervention);
  };

  const handleTransformToProject = async (intervention: Intervention) => {
    if (!lead) return;
    try {
      const { projectId } = await transformInterventionToProject({
        intervention,
        leadCommune: lead.commune ?? undefined,
        leadName: lead.name,
      });
      // Met à jour localement l'intervention pour faire disparaître le bouton
      setInterventions((prev) =>
        prev.map((i) => (i.id === intervention.id ? { ...i, project_id: projectId } : i)),
      );
      toast.success("Brouillon de chantier vitrine créé", {
        description: "Édite le titre, ajoute des photos puis publie quand prêt.",
      });
      navigate(`/admin/chantiers/${projectId}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "transformation impossible";
      toast.error("Erreur : " + msg);
    }
  };

  const handleConfirmAnnulation = async (raison: string | null) => {
    if (!cancellingIntervention) return;
    setSubmittingAnnulation(true);
    try {
      const updated = await updateInterventionStatut(cancellingIntervention.id, "annule");
      // On met aussi à jour notes_internes pour tracer la raison côté admin
      if (raison) {
        const newNotes = [updated.notes_internes, `[Annulation] ${raison}`]
          .filter(Boolean)
          .join("\n\n");
        await updateIntervention({
          id: updated.id,
          typeIntervention: updated.type_intervention as TypeIntervention,
          dateDebut: updated.date_debut,
          dateFin: updated.date_fin,
          heureDebut: updated.heure_debut.slice(0, 5),
          heureFin: updated.heure_fin.slice(0, 5),
          notesClient: updated.notes_client ?? "",
          notesInternes: newNotes,
        });
        updated.notes_internes = newNotes;
      }
      setInterventions((prev) =>
        prev.map((i) => (i.id === updated.id ? { ...updated, statut: "annule" } : i)),
      );
      // ⚠ on garde cancellingIntervention pour afficher l'écran de notification
      // (le dialog passe en step "confirmed"). Reset au close.
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "annulation impossible";
      toast.error("Erreur : " + msg);
      throw e;
    } finally {
      setSubmittingAnnulation(false);
    }
  };

  const handleRdvCancel = async () => {
    if (!lead || !rdv) return;
    const info = leadInfo();
    if (!info) return;
    setCancellingRdv(true);
    try {
      const { error } = await supabase.from("rendez_vous")
        .update({ statut: "annule" })
        .eq("id", rdv.id);
      if (error) throw error;
      await sendRdvAnnulationEmail(info, rdv);
      await updateLeadStatus(lead.id, "RDV annulé");
      setLead({ ...lead, status: "RDV annulé" });
      setRdv(null);
      toast.success("RDV annulé, email envoyé au client");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "annulation impossible";
      toast.error("Erreur : " + msg);
    } finally {
      setCancellingRdv(false);
    }
  };

  if (authLoading || !user || loading || !lead) return <AdminLoading />;

  const formatDate = (s: string) =>
    new Date(s).toLocaleString("fr-BE", { dateStyle: "long", timeStyle: "short" });

  const info = leadInfo()!;
  const quickMessage = communicationMessage();
  const encodedBody = encodeURIComponent(quickMessage.body);
  const whatsappHref = `https://wa.me/${cleanPhoneForWhatsapp(lead.phone)}?text=${encodedBody}`;
  const smsHref = `sms:${lead.phone}?body=${encodedBody}`;
  // mailto utilise encodeURIComponent (espaces → %20) pour conformité RFC 6068.
  // Sinon URLSearchParams produit "+" qui s'affiche littéralement sur Gmail mobile.
  const emailHref = `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent(quickMessage.subject)}&body=${encodedBody}`;
  // Itinéraire Google Maps depuis l'adresse précise (fallback adresse libre).
  const mapsDirQuery =
    [lead.rue, lead.numero, lead.code_postal, lead.commune].filter(Boolean).join(" ").trim() ||
    (lead.address ?? "").trim();
  const mapsDirUrl = mapsDirQuery
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsDirQuery)}`
    : null;

  return (
    <AdminShell email={user.email} mobileTitle={lead.name}>
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-display font-bold truncate">{lead.name}</h1>
          <p className="text-xs text-muted-foreground">Reçu le {formatDate(lead.created_at)}</p>
        </div>
      </div>

      {/* Phase 1.3 — barre d'actions figée : l'essentiel accessible sans scroller.
          Reste collée sous la topbar mobile (top-14) / en haut sur desktop (top-0). */}
      <div className="sticky top-14 md:top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-2 bg-background/95 backdrop-blur border-y border-border/50 flex gap-2">
        <Button asChild size="sm" variant="copper" className="flex-1 min-h-[44px]">
          <a href={`tel:${lead.phone}`} aria-label={`Appeler ${lead.name}`}>
            <Phone className="w-4 h-4" /> Appeler
          </a>
        </Button>
        {mapsDirUrl && (
          <Button asChild size="sm" variant="outline" className="flex-1 min-h-[44px]">
            <a href={mapsDirUrl} target="_blank" rel="noreferrer" aria-label="Itinéraire">
              <Navigation className="w-4 h-4" /> Itinéraire
            </a>
          </Button>
        )}
        {rdv ? (
          <Button
            asChild
            size="sm"
            className="flex-1 min-h-[44px] bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
          >
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </Button>
        ) : (
          <Button
            onClick={() => { setEditing(false); setShowForm(true); }}
            size="sm"
            variant="outline"
            className="flex-1 min-h-[44px]"
          >
            <CalendarPlus className="w-4 h-4" /> Caler RDV
          </Button>
        )}
      </div>

      {/* RDV planifié (en haut, encadré orange) */}
      {rdv && !showForm && (
        <RendezVousCard
          rdv={rdv}
          lead={info}
          cancelling={cancellingRdv}
          onEdit={() => { setEditing(true); setShowForm(true); }}
          onCancel={handleRdvCancel}
        />
      )}

      {/* Contact */}
      <Card className="p-4 sm:p-6 space-y-4">
        <h2 className="font-semibold text-lg">Coordonnées</h2>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Nom :</span> {lead.name}</div>
          <div className="break-all"><span className="text-muted-foreground">Email :</span> <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a></div>
          <div><span className="text-muted-foreground">Téléphone :</span> <a href={`tel:${lead.phone}`} className="text-primary hover:underline">{lead.phone}</a></div>
          <div className="sm:col-span-2">
            <span className="text-muted-foreground">Adresse :</span>
            {(lead.rue || lead.commune || lead.address) ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  [lead.rue, lead.numero, lead.code_postal, lead.commune].filter(Boolean).join(" ") || lead.address
                )}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block leading-snug text-primary hover:underline"
              >
                {(lead.rue || lead.commune) ? (
                  <>
                    <div>{[lead.rue, lead.numero].filter(Boolean).join(" ")}</div>
                    <div>{[lead.code_postal, lead.commune].filter(Boolean).join(" ")}</div>
                  </>
                ) : (
                  <span>{lead.address}</span>
                )}
                <span className="text-xs text-muted-foreground block mt-0.5">↗ Ouvrir dans Google Maps</span>
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button asChild variant="copper" size="lg" className="flex-1 min-h-[48px]">
            <a href={`tel:${lead.phone}`}><Phone className="w-4 h-4" /> Appeler ce client</a>
          </Button>
          <Button asChild variant="outline" size="lg" className="flex-1 min-h-[48px]">
            <a href={`mailto:${lead.email}`}><Mail className="w-4 h-4" /> Envoyer un email</a>
          </Button>
        </div>
      </Card>

      {/* Demande (repliable, ouverte par défaut — contexte avant la visite) */}
      <CollapsibleCard title="Détails de la demande" defaultOpen>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Type de client :</span> {lead.client_type}</div>
          <div><span className="text-muted-foreground">Timing :</span> {lead.timing || "Non précisé"}</div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Source :</span>
            <Badge variant="secondary">{leadSourceLabel(lead.source)}</Badge>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">Services demandés :</p>
          <div className="flex flex-wrap gap-2">
            {lead.services?.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">Message :</p>
          <div className="bg-muted/50 rounded-md p-4 text-sm whitespace-pre-wrap">{lead.message}</div>
        </div>
      </CollapsibleCard>

      {/* Checklist visite */}
      <ChecklistVisite
        leadId={lead.id}
        leadServices={lead.services || []}
        rdvTypeVisite={rdv?.type_visite}
        defaultOpen={!!rdv}
      />

      {/* Photos */}
      {photoUrls.length > 0 && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Photos ({photoUrls.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photoUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-md border hover:opacity-80 transition">
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Chantiers programmés (devis accepté → blocage de dates) */}
      <Card className="p-6 space-y-4 border-primary/30">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Hammer className="w-5 h-5 text-primary" />
          Chantiers programmés
        </h2>

        {interventions.length > 0 ? (
          <div className="space-y-3">
            {interventions.map((it) => (
              <InterventionCard
                key={it.id}
                intervention={it}
                clientName={lead.name}
                clientPhone={lead.phone}
                clientEmail={lead.email}
                clientAddress={
                  [lead.rue, lead.numero, lead.code_postal, lead.commune]
                    .filter(Boolean)
                    .join(" ") || lead.address
                }
                onEdit={() => handleEditIntervention(it)}
                onCancel={() => handleAskCancelIntervention(it)}
                onTransformToProject={() => handleTransformToProject(it)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun chantier programmé pour ce lead. Une fois le devis accepté,
            bloque les dates et envoie la confirmation au client.
          </p>
        )}

        <Button
          onClick={() => setInterventionDialogOpen(true)}
          variant="copper"
          size="lg"
          className="min-h-[48px]"
        >
          <Hammer className="w-4 h-4" />
          {interventions.length > 0
            ? "Programmer un autre chantier"
            : "Programmer le chantier"}
        </Button>
      </Card>

      {/* Dialog de création/édition d'intervention */}
      <InterventionDialog
        open={interventionDialogOpen}
        onOpenChange={(o) => {
          setInterventionDialogOpen(o);
          if (!o) setEditingIntervention(null);
        }}
        intervention={editingIntervention}
        defaultType={guessTypeIntervention()}
        onSubmit={handleInterventionSubmit}
        submitting={submittingIntervention}
      />

      {/* Écran de succès post-création (mode confirmation) */}
      {lastCreatedIntervention && (
        <InterventionSuccessScreen
          open={!!lastCreatedIntervention}
          onOpenChange={(o) => {
            if (!o) setLastCreatedIntervention(null);
          }}
          intervention={lastCreatedIntervention}
          mode="confirmation"
          clientName={lead.name}
          clientPhone={lead.phone}
          clientEmail={lead.email}
          clientAddress={
            [lead.rue, lead.numero, lead.code_postal, lead.commune]
              .filter(Boolean)
              .join(" ") || lead.address
          }
        />
      )}

      {/* Écran de rectification post-modification */}
      {lastUpdatedIntervention && (
        <InterventionSuccessScreen
          open={!!lastUpdatedIntervention}
          onOpenChange={(o) => {
            if (!o) setLastUpdatedIntervention(null);
          }}
          intervention={lastUpdatedIntervention}
          mode="rectification"
          clientName={lead.name}
          clientPhone={lead.phone}
          clientEmail={lead.email}
          clientAddress={
            [lead.rue, lead.numero, lead.code_postal, lead.commune]
              .filter(Boolean)
              .join(" ") || lead.address
          }
        />
      )}

      {/* Dialog d'annulation d'intervention */}
      {cancellingIntervention && (
        <InterventionAnnulationDialog
          open={!!cancellingIntervention}
          onOpenChange={(o) => {
            if (!o) setCancellingIntervention(null);
          }}
          intervention={cancellingIntervention}
          clientName={lead.name}
          clientPhone={lead.phone}
          clientEmail={lead.email}
          onConfirm={handleConfirmAnnulation}
          submitting={submittingAnnulation}
        />
      )}

      {/* Planifier / modifier RDV */}
      {/* scroll-mt : marge sous la barre d'actions collée (top-14 mobile / top-0 desktop)
          pour que le titre ne soit pas masqué par la barre au scrollIntoView. */}
      <Card ref={rdvSectionRef} className="scroll-mt-32 md:scroll-mt-20 p-6 space-y-4 border-[hsl(var(--copper))]/30">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <CalendarPlus className="w-5 h-5 text-[hsl(var(--copper))]" />
          {editing ? "Modifier le rendez-vous" : rdv ? "Replanifier" : "Planifier un rendez-vous"}
        </h2>
        {showForm ? (
          <RendezVousForm
            initial={editing ? rdv : null}
            submitting={submittingRdv}
            submitLabel={editing ? "Enregistrer les modifications" : undefined}
            onSubmit={handleRdvSubmit}
            onCancel={() => { setShowForm(false); setEditing(false); }}
          />
        ) : !rdv ? (
          <Button
            onClick={() => { setEditing(false); setShowForm(true); }}
            variant="copper"
            size="lg"
          >
            <CalendarPlus className="w-4 h-4" /> Planifier un nouveau RDV
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Un RDV est déjà planifié (voir encadré en haut). Cliquez sur "Modifier" pour le changer.
          </p>
        )}
      </Card>

      {/* Gestion */}
      <Card className="p-6 space-y-4 border-primary/30">
        <h2 className="font-semibold text-lg">Gestion du lead</h2>
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Statut</label>
          <Select value={lead.status} onValueChange={updateStatus}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Tier 1 / Phase 3 — suivi devis : la date d'envoi arme les relances
            J+3/7/14 (carte « Relances devis » du cockpit). */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Devis</label>
          <div className="flex flex-wrap items-center gap-2">
            {lead.devis_envoye_at ? (
              <span className="text-sm">Envoyé le <strong>{formatDevisDate(lead.devis_envoye_at)}</strong></span>
            ) : (
              <span className="text-sm text-muted-foreground italic">Pas encore envoyé</span>
            )}
            <Button variant="outline" size="sm" onClick={markDevisToday} className="min-h-[40px]">
              <FileText className="w-4 h-4" />
              {lead.devis_envoye_at ? "Renvoyé aujourd'hui" : "Marquer envoyé aujourd'hui"}
            </Button>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-muted-foreground">Notes internes</label>
            {canDictate && (
              <Button
                type="button"
                variant={listening ? "destructive" : "outline"}
                size="sm"
                onClick={toggleDictation}
                aria-label={listening ? "Arrêter la dictée" : "Dicter une note"}
              >
                {listening ? (
                  <>
                    <MicOff className="w-4 h-4" /> Stop
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" /> Dicter
                  </>
                )}
              </Button>
            )}
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Vos notes sur ce lead... (ou dictez avec le micro)"
          />
          {listening && (
            <p className="text-xs text-primary mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Dictée en cours… parlez, puis « Stop ». Pensez à enregistrer.
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{notes.length}/2000</span>
            <Button onClick={saveNotes} disabled={saving} variant="copper" size="sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer les notes
            </Button>
          </div>
        </div>
      </Card>

      {/* Messages (incrément 1/3) — isolé dans un ErrorBoundary : si la carte
          plante (donnée inattendue), elle disparaît sans casser la fiche. */}
      <ErrorBoundary label="MessagesCard">
        <MessagesCard lead={lead} rdv={rdv} />
      </ErrorBoundary>

      {/* Actions (repliable, fermée par défaut) */}
      <CollapsibleCard title="Actions rapides">
        <div className="grid sm:grid-cols-3 gap-2">
          <Button asChild size="lg" className="min-h-[48px] bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90">
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </Button>
          <Button asChild size="lg" className="min-h-[48px] bg-sms text-sms-foreground hover:bg-sms/90">
            <a href={smsHref}>
              <Smartphone className="w-4 h-4" /> SMS
            </a>
          </Button>
          <Button asChild variant="copper" size="lg" className="min-h-[48px]">
            <a href={emailHref}>
              <Mail className="w-4 h-4" /> Email rapide
            </a>
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="outline" onClick={copyContact} className="flex-1">
            <Copy className="w-4 h-4" /> Copier les coordonnées
          </Button>
          <Button variant="outline" onClick={copyReviewSms} className="flex-1">
            <Star className="w-4 h-4" /> Envoyer le lien avis Google
          </Button>
        </div>
      </CollapsibleCard>

      {/* Réponses rapides (Phase 2.2) — repliable, fermée par défaut */}
      <CollapsibleCard title="Réponses rapides">
        <p className="text-sm text-muted-foreground">
          Un message type pré-rempli, à envoyer en SMS ou WhatsApp sans rien retaper.
        </p>
        <ul className="space-y-2">
          {QUICK_REPLIES.map((q) => {
            const enc = encodeURIComponent(q.body(firstNameOf(lead.name)));
            return (
              <li
                key={q.label}
                className="flex items-center gap-2 flex-wrap sm:flex-nowrap"
              >
                <span className="flex-1 min-w-[8rem] text-sm font-medium">{q.label}</span>
                <Button asChild size="sm" variant="outline" className="min-h-[40px]">
                  <a href={`sms:${lead.phone}?body=${enc}`} aria-label={`SMS : ${q.label}`}>
                    <Smartphone className="w-4 h-4" /> SMS
                  </a>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="min-h-[40px] bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
                >
                  <a
                    href={`https://wa.me/${cleanPhoneForWhatsapp(lead.phone)}?text=${enc}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`WhatsApp : ${q.label}`}
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                </Button>
              </li>
            );
          })}
        </ul>
      </CollapsibleCard>

      {/* Zone dangereuse (repliable, fermée par défaut) */}
      <CollapsibleCard
        title="Zone dangereuse"
        className="mt-8 border-destructive/40 bg-destructive/5"
        titleClassName="text-destructive"
      >
        <p className="text-sm text-muted-foreground">
          La suppression est définitive : le lead et ses photos seront effacés.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting} className="w-full sm:w-auto">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Supprimer ce lead
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce lead ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le lead <strong>{lead.name}</strong> et toutes ses données (photos incluses) seront définitivement supprimés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={deleteLead} className={buttonVariants({ variant: "destructive" })}>
                Oui, supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CollapsibleCard>
      </div>
    </AdminShell>
  );
};

/**
 * Carte « Messages » (incréments 1/3 + 2/3) — isolée dans son propre composant
 * pour être enveloppée d'un ErrorBoundary côté LeadDetail. Défense en profondeur :
 * chaque message est construit dans un try/catch → un template fautif masque
 * seulement sa ligne, jamais toute la carte (et le boundary couvre le reste).
 */
const MessagesCard = ({ lead, rdv }: { lead: Lead; rdv: RendezVous | null }) => {
  const ctx: MsgCtx = { lead, rdv };
  let messageVars: Record<string, string> = {};
  try {
    messageVars = buildMessageVars(ctx);
  } catch {
    messageVars = {};
  }

  const rows = FICHE_MESSAGES.map((m) => {
    try {
      if (m.show && !m.show(ctx)) return null;
      const { sms, wa } = m.build(ctx, messageVars);
      if (!sms && !wa) return null;
      return { m, sms, wa };
    } catch {
      // Message fautif (donnée inattendue) → on l'ignore, les autres restent.
      return null;
    }
  }).filter((x): x is { m: FicheMessage; sms: string; wa: string } => x !== null);

  if (rows.length === 0) return null;

  return (
    <Card className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Messages</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Le bon message, pré-rempli, en 1 tap (SMS ou WhatsApp).
      </p>
      <div className="space-y-3">
        {rows.map(({ m, sms, wa }) => (
          <div key={m.id} className="rounded-lg border bg-background p-3 space-y-2.5">
            <div>
              <p className="font-semibold text-sm leading-tight">{m.title}</p>
              <p className="text-xs text-muted-foreground">{m.moment}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                asChild
                size="lg"
                className="min-h-[48px] text-base bg-sms text-sms-foreground hover:bg-sms/90"
              >
                <a href={buildSmsHref(lead.phone, sms)} aria-label={`SMS : ${m.title}`}>
                  <Smartphone className="w-5 h-5" /> SMS
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                className="min-h-[48px] text-base bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
              >
                <a
                  href={buildWhatsappHref(lead.phone, wa)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`WhatsApp : ${m.title}`}
                >
                  <MessageCircle className="w-5 h-5" /> WhatsApp
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default LeadDetail;
