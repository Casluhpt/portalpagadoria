-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Allow read for all authenticated" ON public.app_config;
DROP POLICY IF EXISTS "Allow update for admins" ON public.app_config;

-- Ensure grants are correct
GRANT SELECT, INSERT, UPDATE ON public.app_config TO authenticated;
GRANT ALL ON public.app_config TO service_role;

-- Recreate policies with proper permissions for admins
-- Admin can do everything on this table
CREATE POLICY "Admins can manage all config" ON public.app_config
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'administrador'))
    WITH CHECK (public.has_role(auth.uid(), 'administrador'));

-- All authenticated users can read the config
CREATE POLICY "All authenticated can view config" ON public.app_config
    FOR SELECT TO authenticated
    USING (true);

-- Register version update v2.8.1
INSERT INTO public.app_versions (versao, lancada_em, titulo, resumo, itens, destaque)
VALUES (
  'v2.8.1',
  NOW(),
  'Segurança e Inteligência Assistencial',
  'Correção das políticas de segurança RLS na tabela de configurações e atualização das diretrizes mestre da IA Assistente para melhor compreensão de contexto.',
  '["Correção de erro RLS (42501) ao gerenciar status da IA", "Atualização do prompt mestre da IA com instruções de contexto prioritário", "Otimização do fluxo de persistência de configurações administrativas"]'::jsonb,
  true
) ON CONFLICT (versao) DO UPDATE SET 
  lancada_em = EXCLUDED.lancada_em,
  titulo = EXCLUDED.titulo,
  resumo = EXCLUDED.resumo,
  itens = EXCLUDED.itens,
  destaque = EXCLUDED.destaque;