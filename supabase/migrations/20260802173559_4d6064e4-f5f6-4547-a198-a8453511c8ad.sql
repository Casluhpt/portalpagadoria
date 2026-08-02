-- 1) RLS na tabela de snapshots de competência
ALTER TABLE public.provisao_fechamento_competencia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem ver fechamentos de competencia" ON public.provisao_fechamento_competencia;
CREATE POLICY "Admins podem ver fechamentos de competencia"
ON public.provisao_fechamento_competencia
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));

DROP POLICY IF EXISTS "Admins podem criar fechamentos de competencia" ON public.provisao_fechamento_competencia;
CREATE POLICY "Admins podem criar fechamentos de competencia"
ON public.provisao_fechamento_competencia
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'administrador'));

GRANT SELECT, INSERT ON public.provisao_fechamento_competencia TO authenticated;
GRANT ALL ON public.provisao_fechamento_competencia TO service_role;

-- 2) Checagem de administrador na RPC de fechamento de competência
CREATE OR REPLACE FUNCTION public.fechar_competencia_provisao(_nome text, _mes text, _ano text, _usuario_id uuid DEFAULT NULL::uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    uid uuid := auth.uid();
    _snapshot jsonb;
    _id uuid;
BEGIN
    IF uid IS NULL OR NOT public.has_role(uid, 'administrador') THEN
        RAISE EXCEPTION 'Apenas administradores podem fechar a competência.';
    END IF;

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
        _nome, _mes, _ano, _snapshot, uid, now()
    ) RETURNING id INTO _id;

    DELETE FROM public.provisao_diaria WHERE mes = _mes;

    RETURN _id::text;
END;
$function$;