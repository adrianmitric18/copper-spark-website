import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CHANTIER_TAGS, CHANTIER_ZONES } from "@/lib/chantiers/types";

interface ProjectFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  selectedZones: string[];
  onToggleZone: (zone: string) => void;
  onClearAll: () => void;
  resultsCount: number;
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
}: ProjectFiltersProps) => {
  const hasActiveFilters =
    search.trim().length > 0 ||
    selectedTags.length > 0 ||
    selectedZones.length > 0;

  return (
    <div className="space-y-4 mb-8">
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un chantier (titre, lieu)…"
          className="pl-9"
        />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Type de chantier
        </p>
        <div className="flex flex-wrap gap-2">
          {CHANTIER_TAGS.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <Badge
                key={tag}
                variant={active ? "default" : "outline"}
                className="cursor-pointer hover:bg-muted transition-colors"
                onClick={() => onToggleTag(tag)}
              >
                {tag}
              </Badge>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Zone
        </p>
        <div className="flex flex-wrap gap-2">
          {CHANTIER_ZONES.map((zone) => {
            const active = selectedZones.includes(zone);
            return (
              <Badge
                key={zone}
                variant={active ? "default" : "outline"}
                className="cursor-pointer hover:bg-muted transition-colors"
                onClick={() => onToggleZone(zone)}
              >
                {zone}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
        <p className="text-sm text-muted-foreground">
          {resultsCount} chantier{resultsCount > 1 ? "s" : ""}
          {hasActiveFilters ? " trouvé" : ""}
          {hasActiveFilters && resultsCount > 1 ? "s" : ""}
        </p>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-muted-foreground"
          >
            <X className="w-3.5 h-3.5" />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProjectFilters;
