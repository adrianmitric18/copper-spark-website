import { useState, useRef } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CHANTIER_TAGS } from "@/lib/chantiers/types";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: readonly string[];
  placeholder?: string;
}

const TagInput = ({
  value,
  onChange,
  suggestions = CHANTIER_TAGS,
  placeholder = "Ajouter un tag…",
}: TagInputProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions
    .filter(
      (s) =>
        !value.includes(s) && s.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 8);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1.5 pr-1">
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:bg-background/30 rounded p-0.5"
                aria-label={`Retirer le tag ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered[0]) addTag(filtered[0]);
              else if (query.trim()) addTag(query);
            }
          }}
          placeholder={placeholder}
        />

        {open && filtered.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-md shadow-md max-h-60 overflow-y-auto">
            {filtered.map((sug) => (
              <button
                key={sug}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(sug)}
                className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                {sug}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagInput;
