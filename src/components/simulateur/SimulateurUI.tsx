/**
 * Simulateur de prix — briques d'interface partagées.
 *
 * Parti pris : une question par écran, cartes de réponse larges et tactiles,
 * barre de progression fine en haut. Pensé pour le pouce sur mobile d'abord ;
 * le desktop réutilise les mêmes blocs, simplement centrés et plus larges.
 *
 * Toutes les icônes sont des SVG Lucide inline — aucune image chargée.
 */

import type { ReactNode } from "react";
import {
  ArrowLeft,
  Building2,
  Car,
  Check,
  CircuitBoard,
  FileText,
  Gauge,
  Hammer,
  Handshake,
  HelpCircle,
  History,
  Home,
  Layers,
  PlugZap,
  Briefcase,
  Route,
  ShieldCheck,
  Shovel,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { IconeChoix } from "@/lib/simulateur/config";

/**
 * Correspondance clé de config -> icône Lucide. C'est le seul endroit qui
 * connaît les composants ; `config.ts` ne manipule que des chaînes.
 */
const ICONES: Record<IconeChoix, LucideIcon> = {
  borne: PlugZap,
  conformite: ShieldCheck,
  combine: Layers,
  depannage: Wrench,
  vente: Handshake,
  certificat: FileText,
  travaux: Hammer,
  proche: Home,
  allee: Route,
  creuser: Shovel,
  recente: CircuitBoard,
  classique: Gauge,
  ancienne: History,
  inconnu: HelpCircle,
  voiture: Car,
  societe: Briefcase,
  immeuble: Building2,
};

// =====================================================================
//  Barre de progression
// =====================================================================

export const ProgressBar = ({ pourcentage }: { pourcentage: number }) => (
  <div className="mb-8">
    <div
      className="h-1 w-full rounded-full bg-border/70 overflow-hidden"
      role="progressbar"
      aria-valuenow={pourcentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progression du simulateur"
    >
      <motion.div
        className="h-full rounded-full bg-gradient-copper"
        initial={false}
        animate={{ width: `${pourcentage}%` }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
    <p className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {pourcentage}% complété
    </p>
  </div>
);

// =====================================================================
//  Coquille d'un écran
// =====================================================================

interface StepShellProps {
  titre: string;
  sousTitre?: string;
  onRetour?: () => void;
  children: ReactNode;
}

export const StepShell = ({ titre, sousTitre, onRetour, children }: StepShellProps) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, x: reduce ? 0 : 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: reduce ? 0 : -28 }}
      transition={{ duration: reduce ? 0.15 : 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {onRetour && (
        <button
          type="button"
          onClick={onRetour}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
      )}
      <h2 className="font-display text-2xl md:text-[2rem] font-bold text-foreground leading-tight mb-2">
        {titre}
      </h2>
      {sousTitre && (
        <p className="text-muted-foreground leading-relaxed mb-7">{sousTitre}</p>
      )}
      <div className={sousTitre ? "" : "mt-7"}>{children}</div>
    </motion.div>
  );
};

// =====================================================================
//  Carte de réponse
// =====================================================================

interface ChoiceCardProps {
  icone: IconeChoix;
  label: string;
  description?: string;
  selectionne?: boolean;
  index: number;
  onClick: () => void;
}

export const ChoiceCard = ({
  icone,
  label,
  description,
  selectionne,
  index,
  onClick,
}: ChoiceCardProps) => {
  const reduce = useReducedMotion();
  const Icone = ICONES[icone];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={selectionne}
      initial={{ opacity: 0, y: reduce ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduce ? 0.15 : 0.3,
        delay: reduce ? 0 : index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={reduce ? undefined : { y: -3 }}
      whileTap={reduce ? undefined : { scale: 0.99 }}
      className={`group w-full text-left rounded-2xl border p-4 md:p-5 transition-[border-color,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        selectionne
          ? "border-primary bg-primary/[0.06] shadow-lg shadow-primary/15"
          : "border-border/70 bg-card hover:border-primary/70 hover:shadow-lg hover:shadow-primary/10"
      }`}
    >
      <span className="flex items-center gap-4">
        {/* Pastille d'icône, teintée cuivre */}
        <span
          aria-hidden="true"
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${
            selectionne
              ? "border-primary/40 bg-primary text-primary-foreground"
              : "border-primary/25 bg-primary/10 text-primary group-hover:bg-primary/15"
          }`}
        >
          <Icone className="h-[22px] w-[22px]" strokeWidth={1.75} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block font-display text-base md:text-[1.0625rem] font-bold text-foreground leading-snug">
            {label}
          </span>
          {description && (
            <span className="mt-1 block text-sm text-muted-foreground leading-relaxed">
              {description}
            </span>
          )}
        </span>

        {/* Coche de sélection */}
        <span
          aria-hidden="true"
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            selectionne
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border group-hover:border-primary/60"
          }`}
        >
          {selectionne && <Check className="h-3.5 w-3.5" />}
        </span>
      </span>
    </motion.button>
  );
};

// =====================================================================
//  Encadré de mention (TVA, déduction, avertissements)
// =====================================================================

export const MentionBox = ({
  children,
  accent = false,
}: {
  children: ReactNode;
  accent?: boolean;
}) => (
  <p
    className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
      accent
        ? "border border-primary/40 bg-primary/[0.07] text-foreground"
        : "border border-border/60 bg-muted/40 text-muted-foreground"
    }`}
  >
    {children}
  </p>
);
