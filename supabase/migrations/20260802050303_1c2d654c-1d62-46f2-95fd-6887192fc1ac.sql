
-- 1. Technical Support Table
CREATE TABLE public.suporte_tecnico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_nome TEXT,
    user_email TEXT,
    assunto TEXT NOT NULL CHECK (assunto IN ('Bug e Correção', 'Erro', 'Melhoria')),
    anexo_url TEXT,
    comentario TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT ON public.suporte_tecnico TO authenticated;
GRANT ALL ON public.suporte_tecnico TO service_role;

ALTER TABLE public.suporte_tecnico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own support requests" ON public.suporte_tecnico
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can see all support requests" ON public.suporte_tecnico
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'administrador'));

-- 2. Concurrency Queue
CREATE TABLE public.concorrencia_fila (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_nome TEXT,
    entrou_em TIMESTAMPTZ DEFAULT now(),
    ativo_desde TIMESTAMPTZ, -- When they started editing
    modulo TEXT NOT NULL, -- e.g. 'pagamentos_diversos'
    status TEXT DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'ativo')),
    UNIQUE (user_id, modulo)
);

GRANT ALL ON public.concorrencia_fila TO authenticated;
GRANT ALL ON public.concorrencia_fila TO service_role;

ALTER TABLE public.concorrencia_fila ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public queue access" ON public.concorrencia_fila FOR ALL TO authenticated USING (true);

-- Enable realtime for the queue
ALTER PUBLICATION supabase_realtime ADD TABLE public.concorrencia_fila;

-- 3. Pedidos Orçamento (Budget)
CREATE TABLE public.pedidos_orcamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_pedido TEXT UNIQUE NOT NULL,
    saldo_inicial NUMERIC(15,2) DEFAULT 0,
    descricao TEXT,
    empresa_codigo TEXT,
    centro_custo TEXT,
    conta TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos_orcamento TO authenticated;
GRANT ALL ON public.pedidos_orcamento TO service_role;

ALTER TABLE public.pedidos_orcamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth access" ON public.pedidos_orcamento FOR ALL TO authenticated USING (true);

-- 4. Enhance Despesas Fixas
ALTER TABLE public.despesas_fixas 
ADD COLUMN IF NOT EXISTS data_emissao DATE,
ADD COLUMN IF NOT EXISTS suspensa BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS motivo_suspensao TEXT,
ADD COLUMN IF NOT EXISTS tipo_pj TEXT CHECK (tipo_pj IN ('Mensal', 'Adiantamento', 'Antecipação', 'PPR')),
ADD COLUMN IF NOT EXISTS valor_realizado NUMERIC(15,2) DEFAULT 0;

-- 5. Version History Update
INSERT INTO public.app_versions (versao, titulo, resumo, autor, lancada_em, destaque, itens, tipo)
VALUES ('2.0.0', 'Fila Virtual e Engenharia de Prompt', 'Implementação de fila de concorrência, suporte técnico e gestão orçamentária em Despesas Fixas.', 'Lovable AI', now(), true, 
'[
  "Sistema de Fila Virtual para Pagamentos Diversos",
  "Central de Suporte (Dúvidas, Sugestões e Melhorias)",
  "Gestão Orçamentária reativa em Despesas Fixas",
  "Lançamento múltiplo de NFs e suspensão de registros",
  "Ações em lote (Ctrl+clique) e filtros avançados"
]', 'major');
