-- Restaura a tabela pagamentos_audit para o estado esperado pelo sistema (com acao e snapshot)
DROP TABLE IF EXISTS public.pagamentos_audit;

CREATE TABLE public.pagamentos_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pagamento_id UUID REFERENCES public.pagamentos_diversos(id) ON DELETE SET NULL,
    acao TEXT NOT NULL DEFAULT 'UPDATE',
    usuario_id UUID REFERENCES auth.users(id),
    usuario_nome TEXT,
    alterado_em TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    dados_anteriores JSONB,
    dados_novos JSONB,
    snapshot JSONB
);

GRANT SELECT, INSERT ON public.pagamentos_audit TO authenticated;
GRANT ALL ON public.pagamentos_audit TO service_role;

ALTER TABLE public.pagamentos_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Gerentes podem ver todos os logs" 
ON public.pagamentos_audit FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'administrador') OR public.has_role(auth.uid(), 'gerente'));

CREATE POLICY "Usuarios podem ver seus proprios logs" 
ON public.pagamentos_audit FOR SELECT TO authenticated 
USING (auth.uid() = usuario_id);
