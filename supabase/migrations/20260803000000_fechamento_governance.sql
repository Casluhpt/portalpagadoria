-- Adiciona funcionalidade de reabertura de competência via RPC
CREATE OR REPLACE FUNCTION public.reabrir_competencia_pagamentos(_fechamento_id uuid, _justificativa text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_role public.app_role;
BEGIN
    -- Verifica se o usuário é administrador
    SELECT role INTO v_user_role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
    IF v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Apenas administradores podem reabrir competências.';
    END IF;

    IF length(_justificativa) < 10 THEN
        RAISE EXCEPTION 'Justificativa muito curta (mínimo 10 caracteres).';
    END IF;

    -- Aqui poderíamos restaurar os dados para a tabela principal se tivéssemos o snapshot,
    -- mas por ora apenas removemos o registro de fechamento para permitir novo processamento,
    -- mantendo a rastreabilidade via auditoria (que será chamada pelo frontend).
    DELETE FROM public.fechamento_pagamentos WHERE id = _fechamento_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reabrir_competencia_pagamentos(uuid, text) TO authenticated;

-- Atualiza permissões da tabela
GRANT SELECT, UPDATE, DELETE ON public.fechamento_pagamentos TO authenticated;
GRANT ALL ON public.fechamento_pagamentos TO service_role;
