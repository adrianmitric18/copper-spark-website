import { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Phone, Mail, Loader2, Copy, Star, Save, Trash2, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import RendezVousForm, { type RdvFormValues } from "@/components/admin/RendezVousForm";
import RendezVousCard from "@/components/admin/RendezVousCard";
import ChecklistVisite from "@/components/admin/ChecklistVisite";
import {
  sendRdvConfirmationEmails,
  sendRdvModificationEmail,
  sendRdvAnnulationEmail,
  type LeadInfo,
} from "@/lib/rdv/emailjs";
import type { RendezVous } from "@/lib/rdv/constants";

const STATUSES = ["nouveau", "traité", "devis envoyé", "converti", "perdu", "RDV confirmé", "RDV annulé"];

type Lead = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  rue: string | null;
  numero: string | null;
  code_postal: string | null;
  commune: string | null;
  client_type: string;
  services: string[];
  message: string;
  timing: string | null;
  source: string | null;
  photo_urls: string[] | null;
  status: string;
  notes: string | null;
  notes_internes?: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  formulaire_site: "Site web",
  telephone: "Téléphone",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  recommandation: "Recommandation",
  chantier: "Chantier",
  autre: "Autre",
};

const sourceLabel = (source?: string | null) => SOURCE_LABELS[source || ""] || source || "Non précisé";

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAdminAuth();
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

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/admin/login"); return; }
    if (!isAdmin) { toast.error("Accès refusé"); navigate("/"); return; }
    if (id) fetchAll(id);
  }, [id, user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (lead) document.title = `${lead.name} – Admin`;
  }, [lead]);

  const fetchAll = async (leadId: string) => {
    setLoading(true);
    const [leadRes, rdvRes] = await Promise.all([
      supabase.from("leads").select("*").eq("id", leadId).maybeSingle(),
      supabase.from("rendez_vous").select("*").eq("lead_id", leadId)
        .in("statut", ["confirme", "rappel_envoye"])
        .order("date_rdv", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (leadRes.error || !leadRes.data) {
      toast.error("Lead introuvable");
      navigate("/admin");
      return;
    }
    const l = leadRes.data as Lead;
    setLead(l);
    setNotes(l.notes_internes || l.notes || "");
    setRdv((rdvRes.data as RendezVous | null) ?? null);

    if (l.photo_urls?.length) {
      const urls = await Promise.all(l.photo_urls.map(async (path) => {
        const { data: signed } = await supabase.storage.from("lead-photos").createSignedUrl(path, 3600);
        return signed?.signedUrl || "";
      }));
      setPhotoUrls(urls.filter(Boolean));
    }
    setLoading(false);
  };

  const updateStatus = async (newStatus: string) => {
    if (!lead) return;
    const { error } = await supabase.from("leads").update({ status: newStatus }).eq("id", lead.id);
    if (error) {
      toast.error("Erreur : " + error.message);
      return;
    }
    setLead({ ...lead, status: newStatus });
    toast.success("Statut mis à jour");
  };

  const saveNotes = async () => {
    if (!lead) return;
    setSaving(true);
    const { error } = await supabase.from("leads").update({ notes_internes: notes }).eq("id", lead.id);
    setSaving(false);
    if (error) {
      toast.error("Erreur : " + error.message);
      return;
    }
    toast.success("Notes enregistrées");
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
      if (lead.photo_urls?.length) {
        const { error: storageErr } = await supabase.storage.from("lead-photos").remove(lead.photo_urls);
        if (storageErr) console.warn("Photos non supprimées:", storageErr.message);
      }
      const { error } = await supabase.from("leads").delete().eq("id", lead.id);
      if (error) throw error;
      toast.success("Lead supprimé");
      navigate("/admin");
    } catch (e: any) {
      toast.error("Erreur : " + (e?.message || "suppression impossible"));
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

  const leadInfo = (): LeadInfo | null => lead && {
    id: lead.id, name: lead.name, email: lead.email, phone: lead.phone,
    rue: lead.rue, numero: lead.numero, code_postal: lead.code_postal, commune: lead.commune,
  };

  // ==== RDV : créer / modifier / annuler ====
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
        await supabase.from("leads").update({ status: "RDV confirmé" }).eq("id", lead.id);
        setLead({ ...lead, status: "RDV confirmé" });
        toast.success("RDV confirmé, 3 emails envoyés");
      }
      setRdv(saved);
      setShowForm(false);
      setEditing(false);
    } catch (e: any) {
      toast.error("Erreur : " + (e?.message || "impossible d'enregistrer le RDV"));
    } finally {
      setSubmittingRdv(false);
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
      await supabase.from("leads").update({ status: "RDV annulé" }).eq("id", lead.id);
      setLead({ ...lead, status: "RDV annulé" });
      setRdv(null);
      toast.success("RDV annulé, email envoyé au client");
    } catch (e: any) {
      toast.error("Erreur : " + (e?.message || "annulation impossible"));
    } finally {
      setCancellingRdv(false);
    }
  };

  if (authLoading || loading || !lead) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  const formatDate = (s: string) =>
    new Date(s).toLocaleString("fr-BE", { dateStyle: "long", timeStyle: "short" });

  const info = leadInfo()!;

  return (
    <>
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin"><ArrowLeft className="w-4 h-4" /> Retour</Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">{lead.name}</h1>
              <p className="text-xs text-muted-foreground">Reçu le {formatDate(lead.created_at)}</p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
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
              <div className="sm:col-span-2"><span className="text-muted-foreground">Source :</span> {lead.source || "Non précisé"}</div>
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
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Notes personnelles</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Vos notes sur ce lead..."
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{notes.length}/500</span>
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
            <div className="flex flex-col sm:flex-row gap-2">
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
        </main>
      </div>
    </>
  );
};

export default LeadDetail;
