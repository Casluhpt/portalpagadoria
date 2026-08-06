CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- Inserir valor padrão para a IA online
INSERT INTO public.app_config (key, value)
VALUES ('ia_online', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

GRANT SELECT, INSERT, UPDATE ON public.app_config TO authenticated;
GRANT ALL ON public.app_config TO service_role;

-- RLS: Apenas admins podem alterar
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all authenticated" ON public.app_config
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow update for admins" ON public.app_config
    FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'administrador'));
