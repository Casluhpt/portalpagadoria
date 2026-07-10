-- Password expiration policy: track when each user last changed their password
CREATE TABLE IF NOT EXISTS public.user_password_metadata (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  password_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_password_metadata TO authenticated;
GRANT ALL ON public.user_password_metadata TO service_role;

ALTER TABLE public.user_password_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own password metadata"
  ON public.user_password_metadata FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update their own password metadata"
  ON public.user_password_metadata FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users insert their own password metadata"
  ON public.user_password_metadata FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all password metadata"
  ON public.user_password_metadata FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'));

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.password_metadata_touch()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_password_metadata_touch ON public.user_password_metadata;
CREATE TRIGGER trg_password_metadata_touch
  BEFORE UPDATE ON public.user_password_metadata
  FOR EACH ROW EXECUTE FUNCTION public.password_metadata_touch();

-- On new user creation, initialize password_changed_at
CREATE OR REPLACE FUNCTION public.handle_new_user_password_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_password_metadata (user_id, password_changed_at)
  VALUES (NEW.id, COALESCE(NEW.created_at, now()))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_user_password_metadata ON auth.users;
CREATE TRIGGER trg_new_user_password_metadata
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_password_metadata();

-- Backfill existing users (use created_at as approximation)
INSERT INTO public.user_password_metadata (user_id, password_changed_at)
SELECT id, COALESCE(created_at, now()) FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Helper: mark password as changed now for the current user
CREATE OR REPLACE FUNCTION public.mark_password_changed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_password_metadata (user_id, password_changed_at)
  VALUES (uid, now())
  ON CONFLICT (user_id) DO UPDATE SET password_changed_at = now(), updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_password_changed() TO authenticated;
