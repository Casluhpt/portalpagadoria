-- Drop and recreate the table to match the expected structure
DROP TABLE IF EXISTS public.pagamentos_audit;

CREATE TABLE public.pagamentos_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pagamento_id UUID NOT NULL REFERENCES public.pagamentos_diversos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES auth.users(id),
    usuario_nome TEXT,
    alterado_em TIMESTAMPTZ DEFAULT now(),
    dados_anteriores JSONB,
    dados_novos JSONB
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
