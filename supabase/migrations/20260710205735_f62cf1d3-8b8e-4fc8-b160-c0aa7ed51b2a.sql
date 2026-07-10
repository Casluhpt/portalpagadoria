CREATE TABLE IF NOT EXISTS public.aprovacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa TEXT,
  tipo TEXT NOT NULL DEFAULT 'mensal' CHECK (tipo IN ('mensal','adto')),
  ordem_pagamento TEXT,
  valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Agendado','Pago','Recusado','Pendente','Cancelado')),
  ano INTEGER NOT NULL DEFAULT 2026,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aprovacoes TO authenticated;
GRANT ALL ON public.aprovacoes TO service_role;
ALTER TABLE public.aprovacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aprov_select" ON public.aprovacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "aprov_insert" ON public.aprovacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "aprov_update" ON public.aprovacoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "aprov_delete" ON public.aprovacoes FOR DELETE TO authenticated USING (has_role(auth.uid(),'administrador'::app_role));
CREATE INDEX idx_aprovacoes_ano ON public.aprovacoes(ano);
CREATE INDEX idx_aprovacoes_empresa_status ON public.aprovacoes(empresa, status);
CREATE TRIGGER aprovacoes_touch BEFORE UPDATE ON public.aprovacoes FOR EACH ROW EXECUTE FUNCTION public.pagamentos_diversos_touch();