CREATE TABLE IF NOT EXISTS public.esocial_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mes_ano TEXT NOT NULL,
    bandeira TEXT,
    num_empresa TEXT,
    empresa TEXT,
    nome_coligada TEXT,
    cnpj TEXT,
    valor_inss NUMERIC(15,2) DEFAULT 0,
    valor_irrf NUMERIC(15,2) DEFAULT 0,
    valor_fgts NUMERIC(15,2) DEFAULT 0,
    valor_pis NUMERIC(15,2) DEFAULT 0,
    status_lancamento TEXT DEFAULT 'Pendente',
    num_fopag TEXT,
    dcomp_compensado BOOLEAN DEFAULT FALSE,
    notificado BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMPTZ DEFAULT now(),
    atualizado_em TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.esocial_base TO authenticated;
GRANT ALL ON public.esocial_base TO service_role;

ALTER TABLE public.esocial_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver base esocial" ON public.esocial_base
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin pode gerenciar base esocial" ON public.esocial_base
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'administrador'));

CREATE TABLE IF NOT EXISTS public.portal_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_settings TO authenticated;
GRANT ALL ON public.portal_settings TO service_role;

ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados leem settings" ON public.portal_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gerencia settings" ON public.portal_settings
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'administrador'));

INSERT INTO public.portal_settings (key, value)
VALUES ('envio_base_pagamentos_email', '{"enabled": false, "email": ""}')
ON CONFLICT (key) DO NOTHING;