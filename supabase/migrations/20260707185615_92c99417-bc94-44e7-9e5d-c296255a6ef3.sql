
CREATE TABLE public.lancamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pre_pedido BIGINT,
  issuer TEXT,
  supplier TEXT,
  invoice_number TEXT,
  account_group TEXT,
  center TEXT,
  company BIGINT,
  due_date DATE,
  gross_amount NUMERIC(14,2),
  register_date DATE,
  desc_status TEXT,
  log TEXT,
  text_field TEXT,
  action TEXT,
  empresa TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos TO authenticated;
GRANT ALL ON public.lancamentos TO service_role;

ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.lancamentos FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.lancamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.lancamentos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete access" ON public.lancamentos FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER lancamentos_set_updated_at
BEFORE UPDATE ON public.lancamentos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX lancamentos_due_date_idx ON public.lancamentos(due_date);
CREATE INDEX lancamentos_empresa_idx ON public.lancamentos(empresa);
CREATE INDEX lancamentos_issuer_idx ON public.lancamentos(issuer);
