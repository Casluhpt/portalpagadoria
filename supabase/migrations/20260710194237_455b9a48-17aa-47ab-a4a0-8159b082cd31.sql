ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS setor TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, nome, setor)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NULLIF(NEW.raw_user_meta_data->>'setor', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET setor = COALESCE(EXCLUDED.setor, public.profiles.setor);
  RETURN NEW;
END;
$function$;