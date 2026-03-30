
CREATE OR REPLACE FUNCTION public.log_lead_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.lead_activities (lead_id, activity_type, description, is_automatic)
    VALUES (
      NEW.id,
      'movimentacao',
      'Status alterado de ' || UPPER(OLD.status) || ' para ' || UPPER(NEW.status),
      true
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_lead_status_update
  AFTER UPDATE OF status ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_lead_status_change();
