CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  checklist_type TEXT NOT NULL CHECK (checklist_type IN ('rgie','pv','borne','installation','generique')),
  item_key TEXT NOT NULL,
  item_label TEXT NOT NULL,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  item_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (lead_id, item_key)
);

CREATE INDEX idx_checklist_items_lead_id ON public.checklist_items(lead_id);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can select checklist_items"
ON public.checklist_items FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Admin can insert checklist_items"
ON public.checklist_items FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admin can update checklist_items"
ON public.checklist_items FOR UPDATE TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin can delete checklist_items"
ON public.checklist_items FOR DELETE TO authenticated
USING (is_admin());

CREATE POLICY "Deny anon all on checklist_items"
ON public.checklist_items FOR ALL TO anon
USING (false) WITH CHECK (false);

CREATE TRIGGER update_checklist_items_updated_at
BEFORE UPDATE ON public.checklist_items
FOR EACH ROW
EXECUTE FUNCTION public.validate_rdv_date();