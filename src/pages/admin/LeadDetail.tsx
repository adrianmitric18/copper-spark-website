import { useEffect, useRef, useState } from "react";

import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
import { Phone, Mail, Loader2, Copy, Star, Save, Trash2, CalendarPlus, MessageCircle, Smartphone, ArrowLeft, Hammer, Mic, MicOff, FileText, CheckCircle2, RotateCcw, X, ClipboardList, Share2 } from "lucide-react";
import { toast } from "sonner";
import RendezVousForm, { type RdvFormValues } from "@/components/admin/RendezVousForm";
import RendezVousCard from "@/components/admin/RendezVousCard";
import ChecklistVisite from "@/components/admin/ChecklistVisite";
import InterventionDialog from "@/components/admin/InterventionDialog";
import InterventionCard from "@/components/admin/InterventionCard";
import SimulateurPayloadCard from "@/components/admin/SimulateurPayloadCard";
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
  envoyerEmailSiPossible,
  type LeadInfo,
  type ResultatEnvoiEmail,
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
  hasUsableEmail,
  traceEnvoi,
  terminerLead,
  terminerRdv,
} from "@/lib/admin/queries";
import { ajouterTrace, formatTraceEnvoi, type CanalEnvoi } from "@/lib/admin/envois";
import { TON } from "@/lib/admin/badges";
import { adresseComplete, texteDevisPourClaude } from "@/lib/admin/devis-claude";
import {
  type Lead,
  type TerminalLeadStatus,
  LEAD_STATUSES,
  STATUT_REACTIVATION,
  TERMINER_CHOIX,
  isRdvPasse,
  isStatutAvecRdv,
  isTerminal,
  leadSourceLabel,
  leadStatusColor,
  libelleStatutLead,
} from "@/lib/admin/types";
import {
  smsBienRecu,
  buildSmsHref,
  buildWhatsappHref,
  smsTemplateRelance1,
  whatsappTemplateRelance1,
  smsTemplateConfirmation,
  whatsappTemplateConfirmation,
  smsTemplateAnnulationRdv,
  whatsappTemplateAnnulationRdv,
  messageDemandeAvis,
  buildMailtoHref,
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

// ── Section « Messages » (incréments 1/3 + 2/3 + 3/3) ───────────────────────
// Catalogue de messages prêts à l'emploi, envoyables en 1 tap (SMS / WhatsApp /
// Email selon le message). Le corps peut contenir des {{variables}} remplies
// depuis la fiche (fillTemplate). Tout ce qui est entre [crochets] reste
// LITTÉRAL : Adrian le complète au moment de l'envoi. Réutilise les templates
// partagés (smsBienRecu, relances, confirmation) de message-templates.
// Contexte = lead + RDV actif lié (pour date/heure/adresse).

// Contexte de remplissage : la fiche + son RDV actif (null si aucun).
interface MsgCtx {
  lead: Lead;
  rdv: RendezVous | null;
}

// Sortie d'un message : un ou plusieurs canaux. SMS/WA = texte ; Email = objet
// + corps (mailto). Un message n'expose que les canaux pertinents.
interface MessageOutput {
  sms?: string;
  wa?: string;
  email?: { subject: string; body: string };
}

// Remplace {{clé}} par sa valeur ; laisse {{clé}} tel quel si inconnue
// (volontairement visible → repère une variable manquante en test).
// Ne touche QU'aux {{accolades}} : les [crochets] passent tels quels.
const fillTemplate = (tpl: string, vars: Record<string, string>): string =>
  tpl.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, k: string) => vars[k.trim()] ?? `{{${k.trim()}}}`);

// hasUsableEmail : source unique dans @/lib/admin/queries (règle 1.3 du brief admin).

// Adresse : champ libre `address` en priorité, sinon recomposée depuis les
// champs structurés (rue/numéro/CP/commune). Vide si rien d'exploitable.
const composeAddress = (lead: Lead): string => adresseComplete(lead);

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
  // Texte final (variables déjà remplies) — canaux exposés selon le message.
  build: (ctx: MsgCtx, vars: Record<string, string>) => MessageOutput;
  // Affiché seulement si pertinent (sinon masqué). Absent = toujours affiché.
  show?: (ctx: MsgCtx) => boolean;
  // Si vrai : taper SMS/WhatsApp stampe aussi devis_envoye_at (confort 1 geste).
  stampDevis?: boolean;
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
    id: "devis-envoye",
    title: "Devis envoyé",
    moment: "Après la visite — le devis part par email (Vertuoza)",
    // Taper SMS/WA stampe aussi devis_envoye_at = aujourd'hui (voir handleDevisEnvoye).
    stampDevis: true,
    build: (_ctx, vars) => {
      const txt = fillTemplate(
        `Bonjour {{prénom}} 👋 C'est Adrian, du Cuivre Électrique. Merci pour votre accueil lors de ma visite !

Je viens de vous envoyer votre devis pour {{objet}} par email 📧 — pensez à jeter un œil à votre boîte (et aux spams au cas où).

Quelques infos utiles :
📅 Devis valable 15 jours
💶 Pour démarrer : acompte de 40 % à la signature, et je vous confirme la date d'intervention dès réception
⚡ Tout imprévu non visible aujourd'hui vous serait signalé avant toute intervention, jamais facturé sans votre accord

Je reste dispo pour la moindre question. À bientôt ! Adrian`,
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
    id: "imprevu-chantier",
    title: "Imprévu chantier",
    moment: "Avant de faire le travail en plus",
    build: (_ctx, vars) => {
      const txt = fillTemplate(
        `Bonjour {{prénom}} 👋 Petit point depuis le chantier, comme convenu.

En avançant, je suis tombé sur [le problème — ex. une perte sur le circuit X] ⚡, pas visible au moment du devis. Rien d'alarmant, mais ça sort de ce qui était prévu, alors je préfère vous prévenir avant d'aller plus loin.

Deux options :
🔧 je le règle à l'heure ([tarif] €/h, ~[X] h)
📝 ou je vous fais un petit devis complémentaire

Je ne touche à rien sans votre feu vert — dites-moi ce qui vous arrange.

À tout de suite ! Adrian`,
        vars,
      );
      return { sms: txt, wa: txt };
    },
  },
  {
    id: "avis-google",
    title: "Avis Google",
    moment: "Chantier fini",
    build: (_ctx, vars) => {
      // Texte partagé avec la liste « Avis à demander » (message-templates).
      const txt = messageDemandeAvis(vars["prénom"], vars["objet"]);
      return { sms: txt, wa: txt };
    },
  },
  {
    id: "relance-paiement-gentil",
    title: "Relance paiement — gentil",
    moment: "1er rappel, sans reproche",
    build: (_ctx, vars) => {
      const txt = fillTemplate(
        `Bonjour {{prénom}} 👋 C'est Adrian, du Cuivre Électrique.

Un petit rappel tout simple : sauf erreur de ma part, la facture [n° facture] du [date facture] ([montant] €) n'a pas encore été réglée — sans doute un oubli, ça arrive 🙂

Pour faire au plus simple :
📱 scannez le QR sur la facture
🏦 ou virement sur BE72 3632 3398 1016 (communication : [n° facture])

Et si le paiement est déjà parti, ne tenez surtout pas compte de ce message !

Bien à vous, Adrian`,
        vars,
      );
      return { sms: txt, wa: txt };
    },
  },
  {
    id: "relance-paiement-ferme",
    title: "Relance paiement — ferme",
    moment: "2e relance, échéance dépassée",
    build: (_ctx, vars) => {
      const txt = fillTemplate(
        `Bonjour {{prénom}}, c'est Adrian, du Cuivre Électrique.

Je reviens vers vous au sujet de la facture [n° facture] ([montant] €), restée impayée malgré mon précédent rappel et désormais échue.

Merci de procéder au règlement sous [délai] jours :
🏦 BE72 3632 3398 1016 (communication : [n° facture])

Sans nouvelle de votre part, je serai contraint d'appliquer les conditions prévues dans mes conditions générales de vente. Et si une difficulté se présente, parlons-en — je préfère toujours trouver une solution ensemble.

Bien à vous, Adrian`,
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
  // Les listes (Aujourd'hui, Leads, Calendrier) gardent 60 s de cache : après
  // un changement fait depuis la fiche, on les invalide pour qu'elles soient
  // justes au retour.
  const queryClient = useQueryClient();
  const rafraichirListes = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-leads-overview"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-rdvs-all"] });
  };
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
  // RDV annulé à l'instant : on garde ses infos pour prévenir le client par message.
  const [rdvAnnule, setRdvAnnule] = useState<RendezVous | null>(null);
  // Lot 2 bis — texte du devis affiché pour copie manuelle si le presse-papiers refuse.
  const [texteDevisManuel, setTexteDevisManuel] = useState<string | null>(null);

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

  // Le formulaire de RDV s'ouvre depuis l'encadré du RDV (« Modifier »,
  // « Replanifier ») ou par un lien « ?rdv=1 » : on amène sa carte dans le
  // viewport dès qu'on l'affiche, sinon on peut croire que rien ne s'est passé.
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
        setLead((prev) => (prev ? { ...prev, status: newStatus, devis_envoye_at: today } : prev));
      } else {
        await updateLeadStatus(lead.id, newStatus);
        setLead((prev) => (prev ? { ...prev, status: newStatus } : prev));
      }
      rafraichirListes();
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
      setLead((prev) => (prev ? { ...prev, status: "devis envoyé", devis_envoye_at: today } : prev));
      toast.success("Devis marqué envoyé aujourd'hui");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "mise à jour impossible";
      toast.error("Erreur : " + msg);
    }
  };

  // Part 2 — taper « Devis envoyé » (SMS/WA) stampe la date d'envoi en 1 geste.
  // Garde-fous : ne re-stampe pas si déjà fait (garde la 1re date), ne rétrograde
  // jamais un statut « converti »/« perdu », et n'interrompt JAMAIS l'ouverture du
  // message (fire-and-forget + try/catch). L'état local est mis à jour aussitôt.
  const handleDevisEnvoye = () => {
    try {
      if (!lead) return;
      if (lead.devis_envoye_at) return; // déjà stampé → on garde la première date
      if (isTerminal(lead.status)) return; // pas de rétrogradation (converti / sans suite / perdu)
      const today = todayIso();
      setLead((prev) => (prev ? { ...prev, status: "devis envoyé", devis_envoye_at: today } : prev)); // visible tout de suite
      setLeadDevisEnvoye(lead.id, today)
        .then(() => toast.success("Devis marqué envoyé aujourd'hui"))
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : "écriture impossible";
          toast.error("Date du devis non enregistrée : " + msg);
        });
    } catch {
      // ne jamais bloquer l'ouverture du SMS/WhatsApp
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

  // Règle 6 du brief admin : chaque SMS / WhatsApp / Email tapé laisse une ligne
  // horodatée dans les notes. Écran d'abord (la ligne apparaît tout de suite),
  // base ensuite (fire-and-forget : n'empêche jamais l'ouverture du message).
  const tracer = (canal: CanalEnvoi, titre: string) => {
    if (!lead) return;
    const ligne = formatTraceEnvoi(canal, titre);
    setNotes((prev) => ajouterTrace(prev, ligne));
    setLead((prev) => (prev ? { ...prev, notes_internes: ajouterTrace(prev.notes_internes, ligne) } : prev));
    void traceEnvoi(lead.id, canal, titre);
  };

  // Règle 3 : un seul endroit pour dire ce qui s'est passé côté email. Jamais
  // un toast.error : le RDV est déjà enregistré quand on arrive ici.
  const afficherResultatEmail = (res: ResultatEnvoiEmail, titre: string) => {
    if (res.statut === "envoye") {
      toast.success(`${titre} — email envoyé au client`, {
        description: "Les boutons SMS / WhatsApp restent disponibles plus bas.",
      });
    } else if (res.statut === "non_envoye") {
      toast.success(titre, {
        description: "Pas d'email pour ce client : préviens-le par SMS ou WhatsApp (boutons plus bas).",
      });
    } else {
      toast.warning(`${titre}, mais l'email n'est pas parti`, {
        description: `${res.erreur ?? "envoi impossible"}. Préviens le client par SMS ou WhatsApp.`,
      });
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
    const text = `${lead.name}\n${lead.phone}\n${hasUsableEmail(lead.email) ? lead.email : ""}\n${formattedAddress()}`;
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
    if (diff < 0) {
      // RDV passé encore ouvert : on ne « confirme » pas une date révolue.
      return {
        subject: "Suite à notre rendez-vous",
        body: `Bonjour ${firstName}, Adrian du Cuivre Électrique. Je reviens vers vous suite à notre rendez-vous du ${formatRdvDateShort(rdv.date_rdv)}.`,
      };
    }
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
      // Règle 3 du brief admin, dans cet ordre : on écrit en base → on met
      // l'écran et le statut à jour → on tente l'email seulement s'il y a une
      // adresse réelle → en cas d'échec, un avertissement, jamais une erreur.
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
      }
      const modification = editing && !!rdv;
      setRdv(saved);
      setRdvAnnule(null);
      setShowForm(false);
      setEditing(false);
      // Statut du lead : seulement à la création (une modification ne doit pas
      // rétrograder un lead « devis envoyé » / « converti »). Un échec ici ne
      // doit ni masquer le RDV enregistré ni empêcher l'email.
      if (!modification) {
        try {
          await updateLeadStatus(lead.id, "RDV confirmé");
          setLead((prev) => (prev ? { ...prev, status: "RDV confirmé" } : prev));
        } catch (stErr: unknown) {
          const m = stErr instanceof Error ? stErr.message : "mise à jour impossible";
          toast.warning("RDV enregistré, mais le statut du lead n'a pas changé", { description: m });
        }
      }
      const titre = modification ? "RDV modifié" : "RDV enregistré";
      // Date passée (on note ce qui s'est passé) : aucun message automatique au client.
      if (saved.date_rdv < todayIso()) {
        toast.success(titre, { description: "Date passée : aucun email envoyé au client." });
      } else {
        const res = await envoyerEmailSiPossible(info, () =>
          modification ? sendRdvModificationEmail(info, saved) : sendRdvConfirmationEmails(info, saved),
        );
        afficherResultatEmail(res, titre);
      }
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
      const annule = rdv;
      const { error } = await supabase.from("rendez_vous")
        .update({ statut: "annule" })
        .eq("id", annule.id);
      if (error) throw error;
      // Règle 3 : écran et statut d'abord, email ensuite (jamais bloquant).
      setRdv(null);
      setRdvAnnule(annule);
      try {
        await updateLeadStatus(lead.id, "RDV annulé");
        setLead((prev) => (prev ? { ...prev, status: "RDV annulé" } : prev));
      } catch (stErr: unknown) {
        const m = stErr instanceof Error ? stErr.message : "mise à jour impossible";
        toast.warning("RDV annulé, mais le statut du lead n'a pas changé", { description: m });
      }
      // RDV déjà passé : inutile d'écrire au client qu'il est annulé.
      if (annule.date_rdv < todayIso()) {
        toast.success("RDV annulé", { description: "Date passée : aucun email envoyé au client." });
      } else {
        const res = await envoyerEmailSiPossible(info, () => sendRdvAnnulationEmail(info, annule));
        afficherResultatEmail(res, "RDV annulé");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "annulation impossible";
      toast.error("Erreur : " + msg);
    } finally {
      setCancellingRdv(false);
    }
  };

  // Lot 1B — bloc « RDV passé » : clôturer le RDV (statut `termine`). Le lead
  // quitte « RDV confirmé » (plus aucun RDV ouvert) pour « traité » ; il reste
  // ouvert pour le devis, la relance ou « Terminer ce lead ».
  const [terminantRdv, setTerminantRdv] = useState(false);
  const handleRdvTermine = async () => {
    if (!lead || !rdv) return;
    setTerminantRdv(true);
    try {
      await terminerRdv(rdv.id);
      setRdv(null);
      setRdvAnnule(null);
      // « RDV confirmé » (fiche) ou `rdv_pris` (RDV rapide) → « traité ».
      if (isStatutAvecRdv(lead.status)) {
        try {
          await updateLeadStatus(lead.id, STATUT_REACTIVATION);
          setLead((prev) => (prev ? { ...prev, status: STATUT_REACTIVATION } : prev));
        } catch (stErr: unknown) {
          const m = stErr instanceof Error ? stErr.message : "mise à jour impossible";
          toast.warning("RDV terminé, mais le statut du lead n'a pas changé", { description: m });
        }
      }
      rafraichirListes();
      toast.success("RDV terminé", {
        description: "Le lead reste ouvert : devis, relance, ou « Terminer ce lead » en bas.",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "clôture impossible";
      toast.error("Erreur : " + msg);
    } finally {
      setTerminantRdv(false);
    }
  };

  // Lot 1B — « Terminer ce lead » (bas de fiche) : applicable quel que soit
  // l'état (avec ou sans RDV, email, devis). Clôt aussi un RDV passé ouvert.
  const [terminantLead, setTerminantLead] = useState(false);
  const handleTerminerLead = async (status: TerminalLeadStatus) => {
    if (!lead) return;
    setTerminantLead(true);
    try {
      const { rdvOk } = await terminerLead(lead.id, status);
      setLead((prev) => (prev ? { ...prev, status } : prev));
      // terminerLead ferme le RDV : passé → terminé ; à venir → annulé, sauf
      // pour un lead converti (la pose peut être à venir).
      const rdvFerme = Boolean(rdv) && (isRdvPasse(rdv) || status !== "converti");
      if (rdvFerme && rdvOk) setRdv(null);
      rafraichirListes();
      if (rdvFerme && !rdvOk) {
        toast.warning(`Lead terminé : ${status}, mais son RDV n'a pas pu être fermé`, {
          description: "Ferme-le depuis l'encadré RDV en haut de la fiche.",
        });
      } else {
        toast.success(`Lead terminé : ${status}`, {
          description: "Il sort des listes actives (onglet « Terminés » dans Leads).",
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "mise à jour impossible";
      toast.error("Erreur : " + msg);
    } finally {
      setTerminantLead(false);
    }
  };

  if (authLoading || !user || loading || !lead) return <AdminLoading />;

  const formatDate = (s: string) =>
    new Date(s).toLocaleString("fr-BE", { dateStyle: "long", timeStyle: "short" });

  const info = leadInfo()!;

  // Lot 2 bis — « Préparer le devis avec Claude » : tout ce que la fiche sait,
  // en texte brut, à coller dans la discussion Claude. Aucun appel d'API.
  const partagePossible = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const preparerDevis = async (partager: boolean) => {
    // Notes : ce qui est À L'ÉCRAN (dictée comprise), même pas encore enregistré.
    // Photos : liens signés refaits maintenant, pour une heure pleine (ceux de
    // l'ouverture de la fiche peuvent déjà avoir expiré après une visite).
    let liens = photoUrls;
    if (lead.photo_urls?.length) {
      try {
        liens = await fetchLeadPhotoSignedUrls(lead.photo_urls);
      } catch {
        // on garde les liens déjà chargés
      }
    }
    const texte = texteDevisPourClaude({ ...lead, notes_internes: notes }, rdv, liens);
    if (partager && partagePossible) {
      try {
        await navigator.share({ title: `Devis — ${lead.name}`, text: texte });
        return;
      } catch (e: unknown) {
        // Feuille de partage refermée : rien à faire. Autre échec : on copie.
        if (e instanceof Error && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(texte);
      setTexteDevisManuel(null);
      toast.success("Texte du devis copié", { description: "Colle-le dans ta discussion Claude." });
    } catch {
      setTexteDevisManuel(texte);
      toast.warning("Copie automatique impossible", { description: "Le texte est affiché : sélectionne-le et copie-le." });
    }
  };
  // Libellé du badge d'en-tête : « RDV passé » (orange, comme partout) quand le
  // lead est en « RDV confirmé » / rdv_pris sans RDV à venir.
  const libelleEntete = libelleStatutLead(lead.status, Boolean(rdv) && !isRdvPasse(rdv));
  const quickMessage = communicationMessage();
  const encodedBody = encodeURIComponent(quickMessage.body);
  const whatsappHref = `https://wa.me/${cleanPhoneForWhatsapp(lead.phone)}?text=${encodedBody}`;
  const smsHref = `sms:${lead.phone}?body=${encodedBody}`;
  // mailto utilise encodeURIComponent (espaces → %20) pour conformité RFC 6068.
  // Sinon URLSearchParams produit "+" qui s'affiche littéralement sur Gmail mobile.
  const emailHref = `mailto:${encodeURIComponent(lead.email ?? "")}?subject=${encodeURIComponent(quickMessage.subject)}&body=${encodedBody}`;
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
      {/* Fiche lead — ordre du lot 2.3 du brief admin : (1) identité + actions,
          (2) rendez-vous, (3) messages, (4) le reste replié par défaut,
          (5) « Terminer ce lead » toujours visible. Rien n'est supprimé : les
          blocs sont seulement déplacés ou repliés. */}
      {/* 1 — Identité : nom, téléphone, commune. */}
      <div className="flex items-start gap-2">
        <Button asChild variant="ghost" size="icon" className="hidden md:inline-flex shrink-0">
          <Link to="/admin/pipeline" aria-label="Retour aux leads">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-display font-bold truncate">{lead.name}</h1>
          <p className="text-sm text-muted-foreground">
            <a href={`tel:${lead.phone}`} className="font-medium text-primary hover:underline">
              {lead.phone}
            </a>
            {lead.commune && <> · {lead.commune}</>}
            {mapsDirUrl && (
              <>
                {" · "}
                <a href={mapsDirUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  Itinéraire
                </a>
              </>
            )}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 ${libelleEntete === "RDV passé" ? TON.orange : leadStatusColor(lead.status)}`}
        >
          {libelleEntete}
        </Badge>
      </div>

      {/* 1 (suite) — Appeler · WhatsApp · SMS (· Email si adresse). Barre figée :
          reste collée sous la barre du haut (top-14 téléphone / top-0 bureau).
          Le texte des messages s'adapte au contexte (avec ou sans RDV). */}
      <div
        className={`sticky top-14 md:top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-2 bg-background/95 backdrop-blur border-y border-border/50 grid gap-1.5 ${
          hasUsableEmail(lead.email) ? "grid-cols-4" : "grid-cols-3"
        }`}
      >
        <Button asChild size="sm" variant="copper" className="min-h-[44px] min-w-0 px-1 gap-1 text-xs sm:text-sm">
          <a href={`tel:${lead.phone}`} aria-label={`Appeler ${lead.name}`}>
            <Phone className="w-4 h-4" /> Appeler
          </a>
        </Button>
        <Button
          asChild
          size="sm"
          className="min-h-[44px] min-w-0 px-1 gap-1 text-xs sm:text-sm bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
        >
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => tracer("WhatsApp", "Message rapide")}
            aria-label={`WhatsApp à ${lead.name}`}
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
        </Button>
        <Button
          asChild
          size="sm"
          className="min-h-[44px] min-w-0 px-1 gap-1 text-xs sm:text-sm bg-sms text-sms-foreground hover:bg-sms/90"
        >
          <a href={smsHref} onClick={() => tracer("SMS", "Message rapide")} aria-label={`SMS à ${lead.name}`}>
            <Smartphone className="w-4 h-4" /> SMS
          </a>
        </Button>
        {hasUsableEmail(lead.email) && (
          <Button asChild size="sm" variant="outline" className="min-h-[44px] min-w-0 px-1 gap-1 text-xs sm:text-sm">
            <a href={emailHref} onClick={() => tracer("Email", "Message rapide")} aria-label={`Email à ${lead.name}`}>
              <Mail className="w-4 h-4" /> Email
            </a>
          </Button>
        )}
      </div>

      {/* 2 — Rendez-vous : créer / modifier / annuler / terminer, puis les boutons de message. */}
      {/* Lot 1B — RDV passé encore ouvert : plus aucune mention « RDV confirmé »,
          trois gestes pour le fermer. */}
      {rdv && !showForm && isRdvPasse(rdv) && (
        <Card className="p-4 sm:p-6 space-y-3 border-2 border-orange-500/50 bg-orange-500/5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h2 className="font-semibold text-lg">RDV passé</h2>
            <Badge variant="outline" className={TON.orange}>
              À clôturer
            </Badge>
          </div>
          <p className="text-sm">
            <span className="font-medium capitalize">{formatRdvDateShort(rdv.date_rdv)}</span> à{" "}
            {formatHeure(rdv.heure_rdv)} · {rdv.type_visite}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={handleRdvTermine}
              disabled={terminantRdv || cancellingRdv}
              variant="copper"
              size="lg"
              className="min-h-[48px] min-w-0 px-1 gap-1 text-[13px] sm:px-2 sm:gap-2 sm:text-base"
            >
              {terminantRdv ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Terminer
            </Button>
            <Button
              onClick={() => { setEditing(true); setShowForm(true); }}
              disabled={terminantRdv || cancellingRdv}
              variant="outline"
              size="lg"
              className="min-h-[48px] min-w-0 px-1 gap-1 text-[13px] sm:px-2 sm:gap-2 sm:text-base"
            >
              <CalendarPlus className="w-4 h-4" /> Replanifier
            </Button>
            <Button
              onClick={handleRdvCancel}
              disabled={terminantRdv || cancellingRdv}
              variant="outline"
              size="lg"
              className="min-h-[48px] min-w-0 px-1 gap-1 text-[13px] sm:px-2 sm:gap-2 sm:text-base text-destructive hover:bg-destructive/10"
            >
              {cancellingRdv ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Annuler
            </Button>
          </div>
        </Card>
      )}

      {rdv && !showForm && !isRdvPasse(rdv) && (
        <RendezVousCard
          rdv={rdv}
          lead={info}
          cancelling={cancellingRdv}
          onEdit={() => { setEditing(true); setShowForm(true); }}
          onCancel={handleRdvCancel}
          onTrace={tracer}
        />
      )}

      {/* RDV annulé à l'instant : prévenir le client par message (règle 2 —
          aucune action ne dépend d'un email). */}
      {rdvAnnule && !rdv && (
        <Card className="p-4 sm:p-6 space-y-3 border-destructive/40 bg-destructive/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-lg">RDV annulé</h2>
              <p className="text-sm text-muted-foreground">
                {formatRdvDateShort(rdvAnnule.date_rdv)} à {formatHeure(rdvAnnule.heure_rdv)} — préviens le client en 1 tap.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setRdvAnnule(null)} aria-label="Masquer ce bloc">
              OK
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild size="lg" className="min-h-[48px] bg-sms text-sms-foreground hover:bg-sms/90">
              <a
                href={buildSmsHref(lead.phone, smsTemplateAnnulationRdv({ clientName: lead.name, dateIso: rdvAnnule.date_rdv, heure: rdvAnnule.heure_rdv.slice(0, 5) }))}
                onClick={() => tracer("SMS", "Annulation RDV")}
                aria-label="Prévenir de l'annulation par SMS"
              >
                <Smartphone className="w-4 h-4" /> SMS
              </a>
            </Button>
            <Button asChild size="lg" className="min-h-[48px] bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90">
              <a
                href={buildWhatsappHref(lead.phone, whatsappTemplateAnnulationRdv({ clientName: lead.name, dateIso: rdvAnnule.date_rdv, heure: rdvAnnule.heure_rdv.slice(0, 5) }))}
                target="_blank"
                rel="noreferrer"
                onClick={() => tracer("WhatsApp", "Annulation RDV")}
                aria-label="Prévenir de l'annulation par WhatsApp"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </Button>
          </div>
        </Card>
      )}

      {/* 2 (suite) — Planifier / modifier le rendez-vous */}
      {/* scroll-mt : marge sous la barre d'actions collée (top-14 mobile / top-0 desktop)
          pour que le titre ne soit pas masqué par la barre au scrollIntoView. */}
      {/* Affichée seulement s'il y a quelque chose à y faire : un formulaire
          ouvert, ou aucun RDV. Sinon l'encadré du RDV juste au-dessus porte déjà
          « Modifier » / « Replanifier ». */}
      {(showForm || !rdv) && (
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
        ) : (
          <Button
            onClick={() => { setEditing(false); setShowForm(true); }}
            variant="copper"
            size="lg"
          >
            <CalendarPlus className="w-4 h-4" /> Planifier un nouveau RDV
          </Button>
        )}
      </Card>
      )}

      {/* 3 — Messages (liste FICHE_MESSAGES, inchangée) — isolé dans un ErrorBoundary : si la carte
          plante (donnée inattendue), elle disparaît sans casser la fiche. */}
      <ErrorBoundary label="MessagesCard">
        <MessagesCard lead={lead} rdv={rdv} onDevisEnvoye={handleDevisEnvoye} onTrace={tracer} />
      </ErrorBoundary>

      {/* Lot 2 bis — Préparer le devis avec Claude (texte brut, aucun appel d'API). */}
      <Card className="p-4 sm:p-6 space-y-3">
        <div>
          <h2 className="font-semibold text-lg">Devis</h2>
          <p className="text-sm text-muted-foreground">
            Copie tout ce que la fiche sait du client (coordonnées, besoin, visite, notes, photos,
            simulateur) pour le coller dans Claude.
          </p>
        </div>
        {/* L'un sous l'autre : sur un téléphone, côte à côte, le libellé principal était coupé. */}
        <div className="grid grid-cols-1 gap-2">
          <Button onClick={() => preparerDevis(false)} variant="copper" size="lg" className="min-h-[48px] min-w-0 px-3">
            <ClipboardList className="w-4 h-4 shrink-0" />
            Préparer le devis avec Claude
          </Button>
          {partagePossible && (
            <Button
              onClick={() => preparerDevis(true)}
              variant="outline"
              size="lg"
              className="min-h-[44px] px-4"
              aria-label="Partager le texte du devis"
            >
              <Share2 className="w-4 h-4" /> Partager
            </Button>
          )}
        </div>
        {texteDevisManuel && (
          <Textarea
            readOnly
            value={texteDevisManuel}
            rows={8}
            className="text-sm"
            aria-label="Texte du devis à copier"
            onFocus={(e) => e.currentTarget.select()}
          />
        )}
      </Card>

      {/* 4 — Le reste, replié par défaut. */}
      {/* Notes internes, avec dictée (repliées) */}
      <CollapsibleCard title="Notes internes">
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
      </CollapsibleCard>

      {/* Checklist visite */}
      <ChecklistVisite
        leadId={lead.id}
        leadServices={lead.services || []}
        rdvTypeVisite={rdv?.type_visite}
        defaultOpen={false}
      />

      {/* Chantiers programmés (devis accepté → blocage de dates) */}
      <CollapsibleCard title={`Chantiers programmés${interventions.length ? ` (${interventions.length})` : ""}`}>

        {interventions.length > 0 ? (
          <div className="space-y-3">
            {interventions.map((it) => (
              <InterventionCard
                key={it.id}
                intervention={it}
                clientName={lead.name}
                clientPhone={lead.phone}
                clientEmail={hasUsableEmail(lead.email) ? lead.email : undefined}
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
      </CollapsibleCard>

      {/* Réponses du simulateur de prix (leads source = simulateur) */}
      {lead.source === "simulateur" && lead.payload && (
        <CollapsibleCard title="Détail simulateur">
          <SimulateurPayloadCard payload={lead.payload} sansCadre />
        </CollapsibleCard>
      )}

      {/* Coordonnées complètes (repliées) */}
      <CollapsibleCard title="Coordonnées">
        <p className="text-xs text-muted-foreground">Reçu le {formatDate(lead.created_at)}</p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Nom :</span> {lead.name}</div>
          {hasUsableEmail(lead.email) && (
            <div className="break-all"><span className="text-muted-foreground">Email :</span> <a href={`mailto:${lead.email}`} className="text-primary hover:underline" onClick={() => tracer("Email", "Email libre")}>{lead.email}</a></div>
          )}
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
          {hasUsableEmail(lead.email) && (
            <Button asChild variant="outline" size="lg" className="flex-1 min-h-[48px]">
              <a href={`mailto:${lead.email}`} onClick={() => tracer("Email", "Email libre")}><Mail className="w-4 h-4" /> Envoyer un email</a>
            </Button>
          )}
        </div>
      </CollapsibleCard>

      {/* Détails de la demande (repliés) */}
      <CollapsibleCard title="Détails de la demande">
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Type de client :</span> {lead.client_type || "—"}</div>
          <div><span className="text-muted-foreground">Timing :</span> {lead.timing || "Non précisé"}</div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Source :</span>
            <Badge
              variant="secondary"
              className={
                lead.source === "simulateur"
                  ? "bg-primary/15 text-primary border-primary/30"
                  : undefined
              }
            >
              {leadSourceLabel(lead.source)}
            </Badge>
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
          <div className="bg-muted/50 rounded-md p-4 text-sm whitespace-pre-wrap">{lead.message || "—"}</div>
        </div>
      </CollapsibleCard>

      {/* Photos */}
      {photoUrls.length > 0 && (
        <CollapsibleCard title={`Photos (${photoUrls.length})`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photoUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-md border hover:opacity-80 transition">
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </a>
            ))}
          </div>
        </CollapsibleCard>
      )}

      {/* Statut et devis (repliés) */}
      <CollapsibleCard title="Statut et devis">
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
      </CollapsibleCard>

      {/* Actions (repliable, fermée par défaut) */}
      <CollapsibleCard title="Actions rapides">
        <div className="grid sm:grid-cols-3 gap-2">
          <Button asChild size="lg" className="min-h-[48px] bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90">
            <a href={whatsappHref} target="_blank" rel="noreferrer" onClick={() => tracer("WhatsApp", "Message rapide")}>
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </Button>
          <Button asChild size="lg" className="min-h-[48px] bg-sms text-sms-foreground hover:bg-sms/90">
            <a href={smsHref} onClick={() => tracer("SMS", "Message rapide")}>
              <Smartphone className="w-4 h-4" /> SMS
            </a>
          </Button>
          {hasUsableEmail(lead.email) && (
            <Button asChild variant="copper" size="lg" className="min-h-[48px]">
              <a href={emailHref} onClick={() => tracer("Email", "Message rapide")}>
                <Mail className="w-4 h-4" /> Email rapide
              </a>
            </Button>
          )}
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
                  <a href={`sms:${lead.phone}?body=${enc}`} aria-label={`SMS : ${q.label}`} onClick={() => tracer("SMS", `Réponse rapide : ${q.label}`)}>
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
                    onClick={() => tracer("WhatsApp", `Réponse rapide : ${q.label}`)}
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

      {/* 5 — Terminer ce lead : toujours visible en bas de fiche. */}
      <Card className="p-4 sm:p-6 space-y-3">
        {isTerminal(lead.status) ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold text-lg">Lead terminé</h2>
              <p className="text-sm text-muted-foreground">
                Statut : {lead.status}. Il n'apparaît plus dans les listes actives.
              </p>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="min-h-[48px]"
              onClick={() => updateStatus(STATUT_REACTIVATION)}
            >
              <RotateCcw className="w-4 h-4" /> Réactiver
            </Button>
          </div>
        ) : (
          <>
            <div>
              <h2 className="font-semibold text-lg">Terminer ce lead</h2>
              <p className="text-sm text-muted-foreground">
                Il sort des listes actives et reste dans « Terminés ».
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TERMINER_CHOIX.map((c) => (
                <Button
                  key={c.value}
                  variant={c.value === "converti" ? "copper" : "outline"}
                  size="lg"
                  className="min-h-[48px] min-w-0 px-1 gap-1 text-[13px] sm:px-2 sm:gap-2 sm:text-base"
                  disabled={terminantLead}
                  onClick={() => handleTerminerLead(c.value)}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          </>
        )}
      </Card>

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

      {/* Dialogues des chantiers programmés (hors flux visuel). */}
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
          clientEmail={hasUsableEmail(lead.email) ? lead.email : undefined}
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
          clientEmail={hasUsableEmail(lead.email) ? lead.email : undefined}
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
          clientEmail={hasUsableEmail(lead.email) ? lead.email : undefined}
          onConfirm={handleConfirmAnnulation}
          submitting={submittingAnnulation}
        />
      )}
      </div>
    </AdminShell>
  );
};

/**
 * Carte « Messages » (incréments 1/3 + 2/3 + 3/3) — isolée dans son propre
 * composant pour être enveloppée d'un ErrorBoundary côté LeadDetail. Défense en
 * profondeur : chaque message est construit dans un try/catch → un template
 * fautif masque seulement sa ligne, jamais toute la carte (et le boundary couvre
 * le reste). Chaque message expose ses canaux (SMS/WhatsApp et/ou Email).
 */
const MessagesCard = ({
  lead,
  rdv,
  onDevisEnvoye,
  onTrace,
}: {
  lead: Lead;
  rdv: RendezVous | null;
  onDevisEnvoye: () => void;
  /** Règle 6 : trace l'envoi dans les notes du lead. */
  onTrace: (canal: CanalEnvoi, titre: string) => void;
}) => {
  const ctx: MsgCtx = { lead, rdv };
  let messageVars: Record<string, string> = {};
  try {
    messageVars = buildMessageVars(ctx);
  } catch {
    messageVars = {};
  }

  // Destinataire email : seulement si réel (sinon mailto sans destinataire,
  // Adrian le saisit). Évite d'écrire au placeholder local.
  const emailTo = hasUsableEmail(lead.email) ? lead.email : undefined;

  const rows = FICHE_MESSAGES.map((m) => {
    try {
      if (m.show && !m.show(ctx)) return null;
      const out = m.build(ctx, messageVars);
      if (!out.sms && !out.wa && !out.email) return null;
      return { m, out };
    } catch {
      // Message fautif (donnée inattendue) → on l'ignore, les autres restent.
      return null;
    }
  }).filter((x): x is { m: FicheMessage; out: MessageOutput } => x !== null);

  if (rows.length === 0) return null;

  return (
    <Card className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Messages</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Le bon message, pré-rempli, en 1 tap (SMS, WhatsApp ou Email).
      </p>
      <div className="space-y-3">
        {rows.map(({ m, out }) => (
          <div key={m.id} className="rounded-lg border bg-background p-3 space-y-2.5">
            <div>
              <p className="font-semibold text-sm leading-tight">{m.title}</p>
              <p className="text-xs text-muted-foreground">{m.moment}</p>
            </div>

            {(out.sms !== undefined || out.wa !== undefined) && (
              <div className="grid grid-cols-2 gap-2">
                {out.sms !== undefined && (
                  <Button
                    asChild
                    size="lg"
                    className="min-h-[48px] text-base bg-sms text-sms-foreground hover:bg-sms/90"
                  >
                    <a
                      href={buildSmsHref(lead.phone, out.sms)}
                      onClick={() => {
                        onTrace("SMS", m.title);
                        if (m.stampDevis) onDevisEnvoye();
                      }}
                      aria-label={`SMS : ${m.title}`}
                    >
                      <Smartphone className="w-5 h-5" /> SMS
                    </a>
                  </Button>
                )}
                {out.wa !== undefined && (
                  <Button
                    asChild
                    size="lg"
                    className="min-h-[48px] text-base bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
                  >
                    <a
                      href={buildWhatsappHref(lead.phone, out.wa)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        onTrace("WhatsApp", m.title);
                        if (m.stampDevis) onDevisEnvoye();
                      }}
                      aria-label={`WhatsApp : ${m.title}`}
                    >
                      <MessageCircle className="w-5 h-5" /> WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            )}

            {out.email && emailTo && (
              <Button asChild size="lg" variant="copper" className="w-full min-h-[48px] text-base">
                <a
                  href={buildMailtoHref(emailTo, out.email.subject, out.email.body)}
                  onClick={() => onTrace("Email", m.title)}
                  aria-label={`Email : ${m.title}`}
                >
                  <Mail className="w-5 h-5" /> Email
                </a>
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default LeadDetail;
