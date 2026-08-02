CREATE TABLE IF NOT EXISTS public.despesas_fixas_notas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    despesa_fixa_id UUID REFERENCES public.despesas_fixas(id) ON DELETE CASCADE,
    numero_nota TEXT,
    numero_pedido TEXT,
    valor NUMERIC(15,2) DEFAULT 0,
    data_emissao DATE,
    data_vencimento DATE,
    data_lancamento TIMESTAMPTZ DEFAULT now(),
    tipo TEXT DEFAULT 'Mensal',
    criado_em TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.despesas_fixas_notas TO authenticated;
GRANT ALL ON public.despesas_fixas_notas TO service_role;
ALTER TABLE public.despesas_fixas_notas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage notes for their expenses" ON public.despesas_fixas_notas FOR ALL TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.pedidos_orcamento (
    numero_pedido TEXT PRIMARY KEY,
    saldo_inicial NUMERIC(15,2) DEFAULT 0,
    descricao TEXT,
    criado_em TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos_orcamento TO authenticated;
GRANT ALL ON public.pedidos_orcamento TO service_role;
ALTER TABLE public.pedidos_orcamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and manage order budgets" ON public.pedidos_orcamento FOR ALL TO authenticated USING (true);

ALTER TABLE public.despesas_fixas 
ADD COLUMN IF NOT EXISTS valor_previsto_anual NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sap_code TEXT,
ADD COLUMN IF NOT EXISTS pedido_antigo TEXT,
ADD COLUMN IF NOT EXISTS pedido_novo TEXT;