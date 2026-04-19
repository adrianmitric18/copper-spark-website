import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
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
import Logo from "@/components/Logo";
import { Loader2, Plus, Star, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Testimonial = {
  id: string;
  name: string;
  city: string | null;
  service: string | null;
  rating: number;
  message: string;
  approved: boolean;
  created_at: string;
};

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
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAdminAuth();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Testimonial | null>(null);

  useEffect(() => { document.title = "Gestion des avis – Admin"; }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/admin/login"); return; }
    if (!isAdmin) { toast.error("Accès refusé"); navigate("/"); return; }
    fetchItems();
  }, [user, authLoading, isAdmin, navigate]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erreur de chargement : " + error.message);
    else setItems((data as Testimonial[]) || []);
    setLoading(false);
  };

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
      fetchItems();
    } catch (e: any) {
      toast.error("Erreur : " + (e?.message || "enregistrement impossible"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      const { error } = await supabase.from("testimonials").delete().eq("id", toDelete.id);
      if (error) throw error;
      toast.success("Avis supprimé");
      setItems(prev => prev.filter(i => i.id !== toDelete.id));
    } catch (e: any) {
      toast.error("Erreur : " + (e?.message || "suppression impossible"));
    } finally {
      setToDelete(null);
    }
  };

  const approvedCount = items.filter(i => i.approved).length;
  const formatDate = (s: string) => new Date(s).toLocaleDateString("fr-BE");
  const truncate = (s: string, n = 100) => (s.length > n ? s.slice(0, n) + "…" : s);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold">Gestion des avis</p>
              <p className="text-xs text-muted-foreground">{approvedCount} avis publiés</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin"><ArrowLeft className="w-4 h-4" /> Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Gestion des avis</h1>
            <p className="text-sm text-muted-foreground">
              {approvedCount} avis publiés sur {items.length} au total
            </p>
          </div>
          <Button variant="copper" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Ajouter un avis
          </Button>
        </div>

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
      </main>

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
  );
};

export default AvisManager;
