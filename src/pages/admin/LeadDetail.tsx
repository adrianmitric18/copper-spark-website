import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
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
import { ArrowLeft, Phone, Mail, Loader2, Copy, Star, Save } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["nouveau", "traité", "devis envoyé", "converti", "perdu"];

type Lead = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  client_type: string;
  services: string[];
  message: string;
  timing: string | null;
  source: string | null;
  photo_urls: string[] | null;
  status: string;
  notes: string | null;
};

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAdminAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/admin/login"); return; }
    if (!isAdmin) { toast.error("Accès refusé"); navigate("/"); return; }
    if (id) fetchLead(id);
  }, [id, user, authLoading, isAdmin, navigate]);

  const fetchLead = async (leadId: string) => {
    setLoading(true);
    const { data, error } = await supabase.from("leads").select("*").eq("id", leadId).maybeSingle();
    if (error || !data) {
      toast.error("Lead introuvable");
      navigate("/admin");
      return;
    }
    const l = data as Lead;
    setLead(l);
    setNotes(l.notes || "");
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
    const { error } = await supabase.from("leads").update({ notes }).eq("id", lead.id);
    setSaving(false);
    if (error) {
      toast.error("Erreur : " + error.message);
      return;
    }
    toast.success("Notes enregistrées");
  };

  const copyContact = () => {
    if (!lead) return;
    const text = `${lead.name}\n${lead.phone}\n${lead.email}\n${lead.address}`;
    navigator.clipboard.writeText(text);
    toast.success("Coordonnées copiées");
  };

  const copyReviewSms = () => {
    if (!lead) return;
    const firstName = lead.name.split(" ")[0];
    const sms = `Bonjour ${firstName}, j'espère que tout va bien avec l'installation. Si vous êtes satisfait, un petit avis Google m'aiderait beaucoup : https://g.page/r/CVLZZFVq3KkiEBM/review Merci ! Adrian`;
    navigator.clipboard.writeText(sms);
    toast.success("SMS d'avis copié");
  };

  if (authLoading || loading || !lead) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  const formatDate = (s: string) =>
    new Date(s).toLocaleString("fr-BE", { dateStyle: "long", timeStyle: "short" });

  return (
    <>
      <Helmet>
        <title>{lead.name} – Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
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
          {/* Contact */}
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Coordonnées</h2>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Nom :</span> {lead.name}</div>
              <div><span className="text-muted-foreground">Email :</span> <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a></div>
              <div><span className="text-muted-foreground">Téléphone :</span> <a href={`tel:${lead.phone}`} className="text-primary hover:underline">{lead.phone}</a></div>
              <div className="sm:col-span-2"><span className="text-muted-foreground">Adresse :</span> {lead.address}</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button asChild variant="copper" size="lg" className="flex-1">
                <a href={`tel:${lead.phone}`}><Phone className="w-4 h-4" /> Appeler ce client</a>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex-1">
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

          {/* Gestion */}
          <Card className="p-6 space-y-4 border-primary/30">
            <h2 className="font-semibold text-lg">Gestion du lead</h2>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Statut</label>
              <Select value={lead.status} onValueChange={updateStatus}>
                <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
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
        </main>
      </div>
    </>
  );
};

export default LeadDetail;
