import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

// Table `google_rating` absente des types générés → client non typé (cf. useGoogleRating).
const db = supabase as unknown as SupabaseClient;

/**
 * Carte admin : chiffres Google affichés sur le site (note + nombre d'avis).
 * Saisie MANUELLE — la fiche est un établissement zone-de-service non servi par
 * l'API Places. UPSERT dans la table singleton public.google_rating (id = 1).
 */
const GoogleRatingCard = () => {
  const [rating, setRating] = useState<string>("5.0");
  const [total, setTotal] = useState<string>("25");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await db
        .from("google_rating")
        .select("rating, user_ratings_total")
        .eq("id", 1)
        .maybeSingle();
      if (active && !error && data) {
        setRating(String(data.rating));
        setTotal(String(data.user_ratings_total));
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const handleSave = async () => {
    const ratingNum = Number(rating.replace(",", "."));
    const totalNum = Number(total);
    if (!Number.isFinite(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      toast.error("Note invalide (entre 0 et 5).");
      return;
    }
    if (!Number.isInteger(totalNum) || totalNum < 0) {
      toast.error("Nombre d'avis invalide.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await db.from("google_rating").upsert(
        {
          id: 1,
          rating: ratingNum,
          user_ratings_total: totalNum,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
      if (error) throw error;
      toast.success("Chiffres Google enregistrés");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "enregistrement impossible";
      toast.error("Erreur : " + msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
        <h2 className="text-lg font-display font-bold">Chiffres Google affichés sur le site</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Note moyenne et nombre total d'avis de la fiche Google, affichés sur la page d'accueil.
        Saisie manuelle (la fiche n'est pas accessible via l'API Google) : mets ces valeurs à jour
        quand le compteur d'avis évolue.
      </p>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="g-rating">Note (sur 5)</Label>
            <Input
              id="g-rating"
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="sm:w-28"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-total">Nombre d'avis</Label>
            <Input
              id="g-total"
              type="number"
              min={0}
              step={1}
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="sm:w-36"
            />
          </div>
          <Button variant="copper" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      )}
    </Card>
  );
};

export default GoogleRatingCard;
