CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, company_name, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Empresa'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'company_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'company_id')::uuid 
      ELSE NULL 
    END
  );
  RETURN NEW;
END;
$function$;