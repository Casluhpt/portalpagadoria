
CREATE TABLE public.despesas_fixas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL CHECK (categoria IN ('PJ','Pensão','Penhora','Fornecedores')),
  descricao TEXT NOT NULL,
  ano INTEGER NOT NULL DEFAULT 2026,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  observacao TEXT,
  created_by UUID,
  created_by_nome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.despesas_fixas TO authenticated;
GRANT ALL ON public.despesas_fixas TO service_role;

ALTER TABLE public.despesas_fixas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver despesas fixas"
ON public.despesas_fixas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem inserir despesas fixas"
ON public.despesas_fixas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados podem atualizar despesas fixas"
ON public.despesas_fixas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin pode apagar despesas fixas"
ON public.despesas_fixas FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'administrador'));

CREATE INDEX idx_despesas_fixas_ano_mes ON public.despesas_fixas(ano, mes);
CREATE INDEX idx_despesas_fixas_categoria ON public.despesas_fixas(categoria);

CREATE TRIGGER despesas_fixas_touch
BEFORE UPDATE ON public.despesas_fixas
FOR EACH ROW EXECUTE FUNCTION public.pagamentos_diversos_touch();
