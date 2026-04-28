import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CHANTIER_TAGS, CHANTIER_ZONES } from "@/lib/chantiers/types";
import { cn } from "@/lib/utils";

interface ProjectFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  selectedZones: string[];
  onToggleZone: (zone: string) => void;
  onClearAll: () => void;
  resultsCount: number;
  totalCount: number;
}

const ProjectFilters = ({
  search,
  onSearchChange,
  selectedTags,
  onToggleTag,
  selectedZones,
  onToggleZone,
  onClearAll,
  resultsCount,
  totalCount,
}: ProjectFiltersProps) => {
  const hasActiveFilters =
    search.trim().length > 0 ||
    selectedTags.length > 0 ||
    selectedZones.length > 0;

  return (
    <div className="bg-cream/50 border border-cream-dark/40 rounded-2xl p-5 md:p-6 mb-10 space-y-5">
      {/* Header recherche + reset */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-copper pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un chantier (titre, lieu)…"
            className="pl-10 h-11 bg-background border-cream-dark/40 focus-visible:ring-copper/40"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal className="w-4 h-4 text-copper" />
          <span>
            <span className="font-bold text-foreground">{resultsCount}</span>
            {resultsCount !== totalCount && ` / ${totalCount}`} chantier
            {resultsCount > 1 ? "s" : ""}
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-copper hover:text-copper-dark hover:bg-copper/10 ml-1"
            >
              <X className="w-3.5 h-3.5" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <FilterGroup
          label="Type de chantier"
          options={CHANTIER_TAGS}
          selected={selectedTags}
          onToggle={onToggleTag}
        />
        <FilterGroup
          label="Zone géographique"
          options={CHANTIER_ZONES}
          selected={selectedZones}
          onToggle={onToggleZone}
        />
      </div>
    </div>
  );
};

interface FilterGroupProps {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}

const FilterGroup = ({ label, options, selected, onToggle }: FilterGroupProps) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
      {label}
    </p>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border",
              active
                ? "bg-copper text-primary-foreground border-copper shadow-copper/40 shadow-sm"
                : "bg-background text-muted-foreground border-cream-dark/50 hover:border-copper/60 hover:text-copper",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  </div>
);

export default ProjectFilters;
