-- 1. Redefine a integração automática para puxar de pagamentos_diversos
CREATE OR REPLACE FUNCTION public.integrar_pagamentos_na_provisao()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
    today_date date := current_date;
BEGIN
    -- Insere na provisao_diaria a partir de pagamentos_diversos
    INSERT INTO public.provisao_diaria (data, empresa, banco, valor, mes)
    SELECT 
        p.data_credito::date,
        p.empresa,
        COALESCE(p.banco, 'DIVERSOS'),
        p.valor_lg,
        to_char(p.data_credito::date, 'YYYY-MM')
    FROM public.pagamentos_diversos p
    WHERE p.data_credito::date = today_date
    ON CONFLICT DO NOTHING;
END;
$$;

-- 2. Reforçar função de fechamento para limpar por mês
CREATE OR REPLACE FUNCTION public.fechar_competencia_provisao(_nome text, _mes text, _ano text, _usuario_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
    _new_id uuid;
    _snapshot jsonb;
BEGIN
    -- Criar snapshot apenas do mês selecionado
    SELECT jsonb_agg(t) INTO _snapshot 
    FROM (SELECT * FROM public.provisao_diaria WHERE mes = _mes) t;
    
    -- Inserir no histórico
    INSERT INTO public.provisao_fechamento_competencia (nome, mes, ano, fechado_por, snapshot)
    VALUES (_nome, _mes, _ano, _usuario_id, COALESCE(_snapshot, '[]'::jsonb))
    RETURNING id INTO _new_id;
    
    -- Limpar a base atual para esse mês
    DELETE FROM public.provisao_diaria WHERE mes = _mes;
    
    RETURN _new_id;
END;
$$;
