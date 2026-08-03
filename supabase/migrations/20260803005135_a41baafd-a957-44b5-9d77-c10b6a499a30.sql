-- Implementação de Controle de Sessão Única e Integridade de Fila (v2.6.0)

-- 1. Rastreamento de Sessões
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB,
    UNIQUE(user_id, session_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO authenticated;
GRANT ALL ON public.user_sessions TO service_role;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 2. Vínculo de Fila com Sessão
ALTER TABLE public.concorrencia_fila ADD COLUMN IF NOT EXISTS session_id TEXT;

-- 3. Função para garantir Sessão Única
CREATE OR REPLACE FUNCTION public.registrar_sessao_e_limpar_anteriores(_session_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Remove sessões antigas do mesmo usuário
    DELETE FROM public.user_sessions 
    WHERE user_id = auth.uid() 
      AND session_id != _session_id;

    -- Registra ou atualiza a sessão atual
    INSERT INTO public.user_sessions (user_id, session_id, last_seen_at)
    VALUES (auth.uid(), _session_id, now())
    ON CONFLICT (user_id, session_id) 
    DO UPDATE SET last_seen_at = now();

    -- Remove o usuário de qualquer fila se a sessão dele foi invalidada
    -- (O heartbeat da fila cuidará de remover o registro se o session_id não bater)
END;
$$;

-- 4. Proteção de Fila: Impedir múltiplas posições
ALTER TABLE public.concorrencia_fila DROP CONSTRAINT IF EXISTS unique_user_modulo_fila;
ALTER TABLE public.concorrencia_fila ADD CONSTRAINT unique_user_modulo_fila UNIQUE (user_id, modulo);
