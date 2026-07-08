
CREATE TABLE public.provisao_diaria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE,
  empresa TEXT,
  banco TEXT,
  valor NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.provisao_diaria TO anon, authenticated;
GRANT ALL ON public.provisao_diaria TO service_role;

ALTER TABLE public.provisao_diaria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.provisao_diaria FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.provisao_diaria FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.provisao_diaria FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete access" ON public.provisao_diaria FOR DELETE USING (true);

CREATE TRIGGER set_provisao_diaria_updated_at
BEFORE UPDATE ON public.provisao_diaria
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_provisao_diaria_data ON public.provisao_diaria(data);
