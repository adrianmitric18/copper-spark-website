import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, ListChecks, Loader2, Printer, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  CHECKLISTS,
  CHECKLIST_LABELS,
  detectChecklistType,
  type ChecklistType,
} from "@/lib/checklists/definitions";

interface Props {
  leadId: string;
  leadServices: string[];
  rdvTypeVisite?: string | null;
  defaultOpen?: boolean;
}

interface DbItem {
  id: string;
  item_key: string;
  item_label: string;
  is_checked: boolean;
  item_order: number;
  updated_at: string;
}

const ChecklistVisite = ({ leadId, leadServices, rdvTypeVisite, defaultOpen = false }: Props) => {
  const checklistType: ChecklistType = useMemo(
    () => detectChecklistType(rdvTypeVisite || leadServices?.[0]),
    [rdvTypeVisite, leadServices],
  );

  const [items, setItems] = useState<DbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(defaultOpen);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    void loadOrSeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, checklistType]);

  const loadOrSeed = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("checklist_items")
      .select("id,item_key,item_label,is_checked,item_order,updated_at,checklist_type")
      .eq("lead_id", leadId)
      .order("item_order", { ascending: true });

    if (error) {
      toast.error("Erreur chargement checklist : " + error.message);
      setLoading(false);
      return;
    }

    const existingForType = (data || []).filter((d: any) => d.checklist_type === checklistType);

    if (existingForType.length === 0) {
      // Seed
      const template = CHECKLISTS[checklistType];
      const rows = template.map((tpl, idx) => ({
        lead_id: leadId,
        checklist_type: checklistType,
        item_key: tpl.key,
        item_label: tpl.label,
        is_checked: false,
        item_order: idx,
      }));
      const { data: inserted, error: insErr } = await supabase
        .from("checklist_items")
        .insert(rows)
        .select("id,item_key,item_label,is_checked,item_order,updated_at");
      if (insErr) {
        toast.error("Erreur création checklist : " + insErr.message);
        setLoading(false);
        return;
      }
      setItems((inserted || []) as DbItem[]);
    } else {
      setItems(existingForType as DbItem[]);
    }
    setLoading(false);
  };

  const toggle = async (item: DbItem, checked: boolean) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_checked: checked, updated_at: new Date().toISOString() } : i)),
    );
    const { error } = await supabase
      .from("checklist_items")
      .update({ is_checked: checked })
      .eq("id", item.id);
    if (error) {
      toast.error("Erreur sauvegarde");
      // revert
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_checked: !checked } : i)));
    }
  };

  const reset = async () => {
    setResetting(true);
    const { error } = await supabase
      .from("checklist_items")
      .update({ is_checked: false })
      .eq("lead_id", leadId)
      .eq("checklist_type", checklistType);
    setResetting(false);
    if (error) {
      toast.error("Erreur réinitialisation");
      return;
    }
    setItems((prev) => prev.map((i) => ({ ...i, is_checked: false })));
    toast.success("Checklist réinitialisée");
  };

  const printChecklist = () => {
    const remaining = items.filter((i) => !i.is_checked);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Checklist visite</title>
      <style>body{font-family:system-ui,sans-serif;max-width:700px;margin:24px auto;padding:0 16px;color:#222}
      h1{color:#E85D04;font-size:20px;margin-bottom:4px}
      h2{font-size:14px;color:#666;margin:0 0 24px}
      ul{list-style:none;padding:0}
      li{padding:8px 0;border-bottom:1px dashed #ccc;font-size:14px}
      li:before{content:"☐ ";color:#E85D04;font-size:18px;margin-right:6px}
      </style></head><body>
      <h1>Checklist visite — ${CHECKLIST_LABELS[checklistType]}</h1>
      <h2>${remaining.length} élément(s) restant(s)</h2>
      <ul>${remaining.map((i) => `<li>${escapeHtml(i.item_label)}</li>`).join("")}</ul>
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 250);
  };

  const total = items.length;
  const done = items.filter((i) => i.is_checked).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const lastUpdated = items.reduce<string | null>(
    (acc, i) => (!acc || i.updated_at > acc ? i.updated_at : acc),
    null,
  );

  // Group items by template group via key prefix recovery
  const template = CHECKLISTS[checklistType];
  const groupOf = new Map(template.map((t) => [t.key, t.group]));
  const grouped = items.reduce<Record<string, DbItem[]>>((acc, it) => {
    const g = groupOf.get(it.item_key) || "Autres";
    (acc[g] ||= []).push(it);
    return acc;
  }, {});

  return (
    <Card className="border-[hsl(var(--copper))]/30 overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full p-4 sm:p-6 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
          >
            <ListChecks className="w-5 h-5 text-[hsl(var(--copper))] shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-base sm:text-lg truncate">
                Checklist visite — {CHECKLIST_LABELS[checklistType]}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {done}/{total} éléments • {pct}%
              </p>
            </div>
            {open ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 sm:px-6 pb-6 space-y-5">
            <Progress value={pct} className="h-2" />

            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <>
                {Object.entries(grouped).map(([group, list]) => (
                  <div key={group} className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--copper))] mt-4">
                      {group}
                    </h3>
                    <ul className="space-y-3">
                      {list.map((it) => (
                        <li key={it.id}>
                          <label
                            className={`flex items-start gap-4 p-4 min-h-[56px] rounded-md border cursor-pointer transition-colors ${
                              it.is_checked
                                ? "bg-muted/40 border-muted"
                                : "border-border hover:bg-muted/20 active:bg-muted/30"
                            }`}
                          >
                            <Checkbox
                              checked={it.is_checked}
                              onCheckedChange={(c) => toggle(it, Boolean(c))}
                              className="h-6 w-6 mt-0.5 shrink-0"
                            />
                            <span
                              className={`text-base leading-relaxed ${
                                it.is_checked ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {it.item_label}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={printChecklist}
                    className="flex-1"
                  >
                    <Printer className="w-4 h-4" /> Imprimer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={reset}
                    disabled={resetting}
                    className="flex-1"
                  >
                    {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    Réinitialiser
                  </Button>
                </div>

                {lastUpdated && (
                  <p className="text-xs text-muted-foreground text-center">
                    Dernière modification :{" "}
                    {new Date(lastUpdated).toLocaleString("fr-BE", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export default ChecklistVisite;
