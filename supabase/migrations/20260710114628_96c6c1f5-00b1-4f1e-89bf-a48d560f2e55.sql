
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';

CREATE OR REPLACE FUNCTION public.ensure_viewer_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = uid) THEN
    EXECUTE 'INSERT INTO public.user_roles (user_id, role) VALUES ($1, ''viewer''::public.app_role) ON CONFLICT (user_id, role) DO NOTHING' USING uid;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_viewer_role() TO authenticated;
