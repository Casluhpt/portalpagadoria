-- Adicionar coluna canal na tabela comunicados
ALTER TABLE public.comunicados ADD COLUMN IF NOT EXISTS canal text DEFAULT 'portal';

-- Adicionar tabela para arquivamento de fechamentos de aprovação
CREATE TABLE IF NOT EXISTS public.fechamento_aprovacoes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    ano integer NOT NULL,
    arquivo_url text,
    total_registros integer,
    total_valor numeric,
    usuario_id uuid REFERENCES auth.users(id),
    criado_em timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fechamento_aprovacoes TO authenticated;
GRANT ALL ON public.fechamento_aprovacoes TO service_role;

ALTER TABLE public.fechamento_aprovacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select fechamentos" ON public.fechamento_aprovacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert fechamentos" ON public.fechamento_aprovacoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);
