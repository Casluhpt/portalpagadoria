ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS presence_status TEXT NOT NULL DEFAULT 'offline'
    CHECK (presence_status IN ('online','ausente','offline')),
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Ensure users can update their own profile presence (add policy only if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='Users update own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users update own profile" ON public.profiles
      FOR UPDATE TO authenticated
      USING (auth.uid() = id) WITH CHECK (auth.uid() = id)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='Authenticated read profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated read profiles" ON public.profiles
      FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- RPC to update own presence in one call
CREATE OR REPLACE FUNCTION public.set_presence(_status TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  IF _status NOT IN ('online','ausente','offline') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  UPDATE public.profiles
    SET presence_status = _status, last_seen_at = now()
    WHERE id = uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_presence(TEXT) TO authenticated;
