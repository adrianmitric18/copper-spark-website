import { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";
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
import { Phone, Mail, Loader2, Copy, Star, Save, Trash2, CalendarPlus, MessageCircle, Smartphone, ArrowLeft, Hammer } from "lucide-react";
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
import type { RendezVous } from "@/lib/rdv/constants";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import {
  fetchLeadById,
  fetchActiveRdvForLead,
  fetchLeadPhotoSignedUrls,
  updateLeadStatus,
  updateLeadNotes,
  deleteLeadWithPhotos,
} from "@/lib/admin/queries";
import {
  type Lead,
  LEAD_STATUSES,
  leadSourceLabel,
} from "@/lib/admin/types";
import AdminShell from "@/admin/layout/AdminShell";
import AdminLoading from "@/components/admin/AdminLoading";

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

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
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

  const updateStatus = async (newStatus: string) => {
    if (!lead) return;
    try {
      await updateLeadStatus(lead.id, newStatus);
      setLead({ ...lead, status: newStatus });
      toast.success("Statut mis à jour");
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
        await sendRdvConfirmationEmails(info, saved);
        await updateLeadStatus(lead.id, "RDV confirmé");
        setLead({ ...lead, status: "RDV confirmé" });
        toast.success("RDV confirmé, 3 emails envoyés");
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
  const emailHref = `mailto:${lead.email}?subject=${encodeURIComponent(quickMessage.subject)}&body=${encodedBody}`;

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

      {/* Demande */}
      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-lg">Détails de la demande</h2>
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
      </Card>

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
      <Card className="p-6 space-y-4 border-[hsl(var(--copper))]/30">
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
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Notes internes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Vos notes sur ce lead..."
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{notes.length}/2000</span>
            <Button onClick={saveNotes} disabled={saving} variant="copper" size="sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer les notes
            </Button>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-6 space-y-3">
        <h2 className="font-semibold text-lg">Actions rapides</h2>
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
      </Card>

      {/* Zone dangereuse */}
      <Card className="p-6 mt-8 border-destructive/40 bg-destructive/5 space-y-3">
        <h2 className="font-semibold text-lg text-destructive">Zone dangereuse</h2>
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
      </Card>
      </div>
    </AdminShell>
  );
};

export default LeadDetail;
