DROP FUNCTION IF EXISTS public.fechar_competencia_provisao(text,text,text,uuid);

CREATE OR REPLACE FUNCTION public.integrar_pagamentos_na_provisao()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    hoje date := current_date;
BEGIN
    INSERT INTO public.provisao_diaria (data, empresa, banco, valor, mes)
    SELECT 
        p.data_credito,
        p.empresa,
        p.banco,
        SUM(p.valor_lg) as valor_total,
        to_char(p.data_credito, 'YYYY-MM') as mes_doc
    FROM public.pagamentos_diversos p
    WHERE p.data_credito = hoje
    GROUP BY p.data_credito, p.empresa, p.banco
    ON CONFLICT (data, empresa, banco) 
    DO UPDATE SET 
        valor = EXCLUDED.valor,
        updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.fechar_competencia_provisao(
    _nome text,
    _mes text,
    _ano text,
    _usuario_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _snapshot jsonb;
    _id uuid;
BEGIN
    SELECT jsonb_agg(to_jsonb(t)) INTO _snapshot
    FROM (
        SELECT * FROM public.provisao_diaria 
        WHERE mes = _mes
    ) t;

    IF _snapshot IS NULL THEN
        RAISE EXCEPTION 'Nenhum dado encontrado para o mês %', _mes;
    END IF;

    INSERT INTO public.provisao_fechamento_competencia (
        nome, mes, ano, snapshot, fechado_por, data_fechamento
    ) VALUES (
        _nome, _mes, _ano, _snapshot, _usuario_id, now()
    ) RETURNING id INTO _id;

    DELETE FROM public.provisao_diaria WHERE mes = _mes;

    RETURN _id::text;
END;
$$;