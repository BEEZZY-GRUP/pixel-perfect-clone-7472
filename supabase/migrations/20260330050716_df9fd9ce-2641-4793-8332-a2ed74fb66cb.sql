
-- Trigger for lead field edits (not just status)
CREATE OR REPLACE FUNCTION public.log_lead_field_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changes text[] := '{}';
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN changes := array_append(changes, 'Nome: ' || COALESCE(OLD.name,'—') || ' → ' || COALESCE(NEW.name,'—')); END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN changes := array_append(changes, 'E-mail: ' || COALESCE(OLD.email,'—') || ' → ' || COALESCE(NEW.email,'—')); END IF;
  IF NEW.company IS DISTINCT FROM OLD.company THEN changes := array_append(changes, 'Empresa: ' || COALESCE(OLD.company,'—') || ' → ' || COALESCE(NEW.company,'—')); END IF;
  IF NEW.phone IS DISTINCT FROM OLD.phone THEN changes := array_append(changes, 'Telefone: ' || COALESCE(OLD.phone,'—') || ' → ' || COALESCE(NEW.phone,'—')); END IF;
  IF NEW.priority IS DISTINCT FROM OLD.priority THEN changes := array_append(changes, 'Prioridade: ' || COALESCE(OLD.priority,'—') || ' → ' || COALESCE(NEW.priority,'—')); END IF;
  IF NEW.source IS DISTINCT FROM OLD.source THEN changes := array_append(changes, 'Origem: ' || COALESCE(OLD.source,'—') || ' → ' || COALESCE(NEW.source,'—')); END IF;
  IF NEW.challenge IS DISTINCT FROM OLD.challenge THEN changes := array_append(changes, 'Desafio: ' || COALESCE(OLD.challenge,'—') || ' → ' || COALESCE(NEW.challenge,'—')); END IF;
  IF NEW.tags IS DISTINCT FROM OLD.tags THEN changes := array_append(changes, 'Tags alteradas'); END IF;
  IF NEW.last_contact_at IS DISTINCT FROM OLD.last_contact_at THEN changes := array_append(changes, 'Último contato atualizado'); END IF;

  -- Don't log if only status changed (already handled by other trigger) or if only notes/archived changed
  IF array_length(changes, 1) > 0 THEN
    INSERT INTO public.lead_activities (lead_id, activity_type, description, is_automatic)
    VALUES (NEW.id, 'edicao', array_to_string(changes, ' | '), true);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_lead_fields_update
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  WHEN (OLD.status = NEW.status AND OLD.archived = NEW.archived)
  EXECUTE FUNCTION public.log_lead_field_changes();

-- Trigger for diagnostics created
CREATE OR REPLACE FUNCTION public.log_diagnostic_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.lead_activities (lead_id, activity_type, description, is_automatic)
  VALUES (
    NEW.lead_id,
    'diagnostico',
    'Diagnóstico realizado — Score: ' || COALESCE(NEW.score::text, '?') || '/100 | Classificação: ' || UPPER(COALESCE(NEW.classification, '?')) || ' | Tipo: ' || COALESCE(NEW.meeting_type, 'online'),
    true
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_diagnostic_created
  AFTER INSERT ON public.diagnostics
  FOR EACH ROW
  EXECUTE FUNCTION public.log_diagnostic_created();

-- Lead notes table
CREATE TABLE public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_notes_anon_all" ON public.lead_notes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "lead_notes_auth_all" ON public.lead_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger for notes
CREATE OR REPLACE FUNCTION public.log_lead_note_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.lead_activities (lead_id, activity_type, description, is_automatic)
  VALUES (
    NEW.lead_id,
    'nota',
    'Nota adicionada: ' || LEFT(NEW.content, 120),
    true
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_lead_note_created
  AFTER INSERT ON public.lead_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_lead_note_created();
