/**
 * /admin/depannage — « Dépannage au téléphone » (lot 2b.3 du brief admin 2026-11).
 *
 * Le téléphone sonne, quelqu'un est en panne : trois gros boutons de zone, une
 * bascule jour / soir-nuit-dimanche, et le prix à annoncer en très gros. En
 * dessous : le WhatsApp de confirmation pré-rempli et le bouton qui ouvre RDV
 * rapide avec le type « Dépannage » déjà choisi.
 *
 * Aucun montant n'est écrit ici : tout vient de la grille du site
 * (src/lib/simulateur/config.ts) via @/lib/admin/depannage.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, Copy, MessageCircle, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import AdminShell from "@/admin/layout/AdminShell";
import AdminLoading from "@/components/admin/AdminLoading";
import { buildWhatsappHref } from "@/lib/admin/message-templates";
import {
  MARGE_MATERIEL_POURCENT,
  MOMENTS,
  prixDepannage,
  texteWhatsappDepannage,
  zoneDeLaCommune,
  type Moment,
  type Zone,
} from "@/lib/admin/depannage";
import { cn } from "@/lib/utils";

const ZONES_ORDRE: Zone[] = ["zone1", "zone2", "zone3"];

const CHOIX =
  "rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
const CHOIX_ACTIF = "bg-primary text-primary-foreground border-primary";
const CHOIX_INACTIF = "bg-background border-border hover:border-primary/40";

const Depannage = () => {
  const { user, ready } = useAdminGuard();
  const [zone, setZone] = useState<Zone>("zone1");
  const [moment, setMoment] = useState<Moment>("jour");
  const [commune, setCommune] = useState("");
  const [telephone, setTelephone] = useState("");

  useEffect(() => {
    document.title = "Dépannage – Le Cuivre Admin";
  }, []);

  const prix = useMemo(() => prixDepannage(zone, moment), [zone, moment]);
  const message = useMemo(() => texteWhatsappDepannage(zone, moment), [zone, moment]);

  const saisirCommune = (v: string) => {
    setCommune(v);
    const z = zoneDeLaCommune(v);
    if (z) setZone(z);
  };
  const communeReconnue = zoneDeLaCommune(commune);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Message copié");
    } catch {
      toast.error("Copie impossible", { description: "Utilise le bouton WhatsApp." });
    }
  };

  const lienRdv = `/admin/rdv-rapide?${new URLSearchParams({
    type: "depannage",
    ...(telephone.trim() ? { tel: telephone.trim() } : {}),
    ...(commune.trim() ? { commune: commune.trim() } : {}),
  }).toString()}`;

  if (!ready || !user) return <AdminLoading />;

  return (
    <AdminShell mobileTitle="Dépannage">
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Wrench className="w-7 h-7 text-primary shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="text-2xl font-display font-bold">Dépannage au téléphone</h1>
            <p className="text-xs text-muted-foreground">Le prix à annoncer, hors TVA</p>
          </div>
        </div>

        {/* Commune (facultatif) : choisit la zone toute seule */}
        <div className="space-y-2">
          <Label htmlFor="depannage-commune" className="text-base">
            Commune <span className="text-muted-foreground font-normal">(facultatif)</span>
          </Label>
          <Input
            id="depannage-commune"
            value={commune}
            onChange={(e) => saisirCommune(e.target.value)}
            placeholder="Ex. Wavre"
            autoComplete="off"
            autoCapitalize="words"
            className="h-12 text-base"
          />
          {commune.trim().length >= 3 &&
            (communeReconnue === null ? (
              <p className="text-sm font-medium text-destructive" role="status">
                Commune hors liste : vérifie la zone choisie, ou confirme le prix par téléphone.
              </p>
            ) : communeReconnue === zone ? (
              <p className="text-xs text-muted-foreground" role="status">
                {prix.zoneLabel} sélectionnée pour cette commune.
              </p>
            ) : (
              <p className="text-sm font-medium text-destructive" role="status">
                Cette commune est en {prixDepannage(communeReconnue, moment).zoneLabel.toLowerCase()}, mais{" "}
                {prix.zoneLabel.toLowerCase()} est sélectionnée.
              </p>
            ))}
        </div>

        {/* Zone */}
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Zone">
          {ZONES_ORDRE.map((z) => {
            const p = prixDepannage(z, moment);
            const actif = zone === z;
            return (
              <button
                key={z}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => setZone(z)}
                className={cn(CHOIX, "min-h-[72px] px-1 flex flex-col items-center justify-center gap-0.5", actif ? CHOIX_ACTIF : CHOIX_INACTIF)}
              >
                <span className="text-sm font-bold uppercase">{p.zoneLabel}</span>
                <span className="text-lg font-display font-bold tabular-nums">{p.forfait} €</span>
              </button>
            );
          })}
        </div>

        {/* Moment */}
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Moment de l'intervention">
          {MOMENTS.map((m) => {
            const actif = moment === m.value;
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => setMoment(m.value)}
                className={cn(CHOIX, "min-h-[64px] px-2 flex flex-col items-center justify-center gap-0.5 text-center", actif ? CHOIX_ACTIF : CHOIX_INACTIF)}
              >
                <span className="text-sm font-bold">{m.label}</span>
                <span className="text-[11px] leading-tight">{m.detail}</span>
              </button>
            );
          })}
        </div>

        {/* Le prix à annoncer */}
        <Card className="p-5 text-center space-y-1 border-2 border-primary/50" aria-live="polite">
          <p className="text-sm text-muted-foreground">
            {prix.zoneLabel} · {MOMENTS.find((m) => m.value === moment)?.label}
          </p>
          <p className="font-display font-bold tabular-nums leading-none text-7xl">
            {prix.forfait} <span className="text-4xl">€</span>
          </p>
          <p className="text-sm font-medium">HTVA · déplacement et première heure compris</p>
        </Card>

        <ul className="text-sm space-y-1.5">
          <li>
            <span className="font-semibold tabular-nums">{prix.demiHeure} €</span> par demi-heure supplémentaire
            entamée.
          </li>
          <li>
            Soir, nuit, dimanche, férié :{" "}
            <span className="font-semibold tabular-nums">+ {prix.supplementHorsJour} €</span>. Le samedi est au tarif
            jour.
          </li>
          <li>
            Matériel : prix d'achat <span className="font-semibold">+ {MARGE_MATERIEL_POURCENT} %</span>, toujours
            après accord du client.
          </li>
          <li>Paiement immédiat sur place, par QR code.</li>
          <li className="text-muted-foreground">TVA en plus : 6 % (logement de plus de 10 ans) ou 21 %.</li>
        </ul>

        <details className="rounded-lg border bg-card px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium min-h-[32px] flex items-center">
            Communes de la {prix.zoneLabel.toLowerCase()}
          </summary>
          <p className="pt-1 text-muted-foreground">{prix.communes.join(", ")}.</p>
        </details>

        {/* Après l'appel */}
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold text-lg">Confirmer au client</h2>
          <div className="space-y-2">
            <Label htmlFor="depannage-tel" className="text-base">
              Téléphone du client <span className="text-muted-foreground font-normal">(facultatif)</span>
            </Label>
            <Input
              id="depannage-tel"
              type="tel"
              inputMode="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="0485 12 34 56"
              autoComplete="off"
              className="h-12 text-base"
            />
          </div>
          <p className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap">{message}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild size="lg" className="min-h-[48px] bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90">
              <a
                href={buildWhatsappHref(telephone, message)}
                target="_blank"
                rel="noreferrer"
                aria-label="Envoyer le prix annoncé par WhatsApp"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </Button>
            <Button type="button" size="lg" variant="outline" className="min-h-[48px]" onClick={copier}>
              <Copy className="w-4 h-4" /> Copier
            </Button>
          </div>
          <Button asChild size="lg" variant="copper" className="w-full min-h-[52px] text-base">
            <Link to={lienRdv}>
              <CalendarPlus className="w-5 h-5" /> Créer le RDV rapide
            </Link>
          </Button>
        </Card>
      </div>
    </AdminShell>
  );
};

export default Depannage;
