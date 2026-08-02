CREATE TABLE public.material_apoio_favoritos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.material_apoio(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, material_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_apoio_favoritos TO authenticated;
GRANT ALL ON public.material_apoio_favoritos TO service_role;

ALTER TABLE public.material_apoio_favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios gerenciam seus favoritos"
ON public.material_apoio_favoritos
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_material_favoritos_user ON public.material_apoio_favoritos (user_id);

CREATE OR REPLACE FUNCTION public.material_favoritos_touch()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER material_apoio_favoritos_updated_at
BEFORE UPDATE ON public.material_apoio_favoritos
FOR EACH ROW EXECUTE FUNCTION public.material_favoritos_touch();