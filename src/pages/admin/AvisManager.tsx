import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Star, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { fetchTestimonials, deleteTestimonial } from "@/lib/admin/queries";
import type { Testimonial } from "@/lib/admin/types";
import AdminShell from "@/admin/layout/AdminShell";
import AdminLoading from "@/components/admin/AdminLoading";
import GoogleRatingCard from "@/components/admin/GoogleRatingCard";

type FormState = {
  id?: string;
  name: string;
  rating: number;
  message: string;
  city: string;
  service: string;
  date: string; // yyyy-mm-dd
  approved: boolean;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): FormState => ({
  name: "",
  rating: 5,
  message: "",
  city: "",
  service: "",
  date: todayISO(),
  approved: true,
});

const StarPicker = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        type="button"
        key={n}
        onClick={() => onChange(n)}
        className="p-1 rounded hover:bg-muted transition"
        aria-label={`${n} étoiles`}
      >
        <Star
          className={`w-7 h-7 ${
            n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
          }`}
        />
      </button>
    ))}
  </div>
);

const StarRow = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
      />
    ))}
  </div>
);

const AvisManager = () => {
  const { user, ready, loading: authLoading } = useAdminGuard();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Testimonial | null>(null);

  useEffect(() => { document.title = "Gestion des avis – Admin"; }, []);

  const reload = async () => {
    setLoading(true);
    try {
      const data = await fetchTestimonials();
      setItems(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "chargement impossible";
      toast.error("Erreur de chargement : " + msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    void reload();
  }, [ready, user?.id]);

  const openAdd = () => {
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setForm({
      id: t.id,
      name: t.name,
      rating: t.rating,
      message: t.message,
      city: t.city ?? "",
      service: t.service ?? "",
      date: new Date(t.created_at).toISOString().slice(0, 10),
      approved: t.approved,
    });
    setDialogOpen(true);
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return "Le nom est requis.";
    if (form.name.length > 50) return "Le nom doit faire moins de 50 caractères.";
    if (form.rating < 1 || form.rating > 5) return "Note invalide.";
    if (form.message.trim().length < 20) return "Le texte doit contenir au moins 20 caractères.";
    if (form.message.length > 1000) return "Le texte doit faire moins de 1000 caractères.";
    if (form.city && form.city.length > 50) return "La ville doit faire moins de 50 caractères.";
    if (form.service && form.service.length > 100) return "Le service doit faire moins de 100 caractères.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        rating: form.rating,
        message: form.message.trim(),
        city: form.city.trim() || null,
        service: form.service.trim() || null,
        approved: form.approved,
        created_at: new Date(form.date).toISOString(),
      };
      if (form.id) {
        const { error } = await supabase.from("testimonials").update(payload).eq("id", form.id);
        if (error) throw error;
        toast.success("Avis mis à jour");
      } else {
        const { error } = await supabase.from("testimonials").insert(payload);
        if (error) throw error;
        toast.success("Avis ajouté avec succès");
      }
      setDialogOpen(false);
      void reload();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "enregistrement impossible";
      toast.error("Erreur : " + msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteTestimonial(toDelete.id);
      toast.success("Avis supprimé");
      setItems((prev) => prev.filter((i) => i.id !== toDelete.id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "suppression impossible";
      toast.error("Erreur : " + msg);
    } finally {
      setToDelete(null);
    }
  };

  const approvedCount = items.filter(i => i.approved).length;
  const formatDate = (s: string) => new Date(s).toLocaleDateString("fr-BE");
  const truncate = (s: string, n = 100) => (s.length > n ? s.slice(0, n) + "…" : s);

  if (authLoading || !user) return <AdminLoading />;

  return (
    <AdminShell email={user.email} mobileTitle="Avis clients">
      <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Avis clients</h1>
          <p className="text-sm text-muted-foreground">
            {approvedCount} avis publiés sur {items.length} au total
          </p>
        </div>
        <Button variant="copper" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Ajouter un avis
        </Button>
      </div>

      <GoogleRatingCard />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">Aucun avis pour le moment.</Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Texte</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell><StarRow rating={t.rating} /></TableCell>
                    <TableCell className="max-w-md text-sm text-muted-foreground">{truncate(t.message)}</TableCell>
                    <TableCell className="text-sm">{formatDate(t.created_at)}</TableCell>
                    <TableCell>
                      {t.approved ? (
                        <Badge variant="outline" className="bg-green-500/15 text-green-700 border-green-500/30">Approuvé</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">Masqué</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(t)} aria-label="Modifier">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setToDelete(t)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          aria-label="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {items.map(t => (
              <Card key={t.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.created_at)}</p>
                  </div>
                  {t.approved ? (
                    <Badge variant="outline" className="bg-green-500/15 text-green-700 border-green-500/30">Approuvé</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-muted text-muted-foreground">Masqué</Badge>
                  )}
                </div>
                <StarRow rating={t.rating} />
                <p className="text-sm text-muted-foreground">{truncate(t.message, 140)}</p>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(t)}>
                    <Pencil className="w-4 h-4" /> Modifier
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setToDelete(t)}
                    className="text-destructive hover:bg-destructive/10" aria-label="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form.id ? `Modifier l'avis de ${form.name}` : "Ajouter un avis"}
            </DialogTitle>
            <DialogDescription>
              Les champs marqués d'un * sont obligatoires.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du client *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Marie D."
                maxLength={50}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Note *</Label>
              <StarPicker value={form.rating} onChange={(n) => setForm(f => ({ ...f, rating: n }))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Texte de l'avis *</Label>
              <Textarea
                id="message"
                value={form.message}
                onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Collez ici le texte de l'avis Google"
                rows={5}
                maxLength={1000}
                required
              />
              <p className="text-xs text-muted-foreground">{form.message.length} / 1000 caractères</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="Ex: Wavre"
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Input
                  id="service"
                  value={form.service}
                  onChange={(e) => setForm(f => ({ ...f, service: e.target.value }))}
                  placeholder="Ex: Tableau"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date de l'avis</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="approved" className="cursor-pointer">Visible sur /avis</Label>
                <p className="text-xs text-muted-foreground">Publier cet avis publiquement</p>
              </div>
              <Switch
                id="approved"
                checked={form.approved}
                onCheckedChange={(v) => setForm(f => ({ ...f, approved: v }))}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="copper" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {form.id ? "Enregistrer les modifications" : "Publier l'avis"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet avis ?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && <>Supprimer l'avis de <strong>{toDelete.name}</strong> ? Cette action est irréversible.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>
              Oui, supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AdminShell>
  );
};

export default AvisManager;
