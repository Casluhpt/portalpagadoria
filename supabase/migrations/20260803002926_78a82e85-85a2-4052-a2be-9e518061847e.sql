ALTER TABLE public.provisao_fechamento_competencia
  ADD COLUMN IF NOT EXISTS periodo_inicio date,
  ADD COLUMN IF NOT EXISTS periodo_fim date,
  ADD COLUMN IF NOT EXISTS fechado_por_nome text,
  ADD COLUMN IF NOT EXISTS total_registros integer,
  ADD COLUMN IF NOT EXISTS total_valor numeric;

CREATE OR REPLACE FUNCTION public.fechar_competencia_provisao_periodo(
  _nome text,
  _de date,
  _ate date,
  _arquivo_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  uid uuid := auth.uid();
  nome text;
  _snapshot jsonb;
  _qtd integer := 0;
  _total numeric := 0;
  _id uuid;
BEGIN
  IF uid IS NULL OR NOT (
      public.has_role(uid, 'administrador')
      OR public.has_role(uid, 'criador_competencia')
      OR public.has_role(uid, 'operacional')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para fechar competência da Provisão Diária.';
  END IF;

  IF _de IS NULL OR _ate IS NULL OR _ate < _de THEN
    RAISE EXCEPTION 'Período inválido para fechamento.';
  END IF;

  IF coalesce(btrim(_nome), '') = '' THEN
    RAISE EXCEPTION 'Informe um nome para o fechamento.';
  END IF;

  SELECT COALESCE(p.nome, u.email) INTO nome
  FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = uid;

  SELECT jsonb_agg(to_jsonb(t)), count(*), COALESCE(sum(t.valor), 0)
    INTO _snapshot, _qtd, _total
  FROM public.provisao_diaria t
  WHERE t.data BETWEEN _de AND _ate;

  IF _snapshot IS NULL OR _qtd = 0 THEN
    RAISE EXCEPTION 'Nenhum registro da Provisão Diária no período selecionado.';
  END IF;

  INSERT INTO public.provisao_fechamento_competencia (
    nome, mes, ano, snapshot, fechado_por, fechado_por_nome, data_fechamento,
    periodo_inicio, periodo_fim, total_registros, total_valor, arquivo_url
  ) VALUES (
    _nome, to_char(_de, 'YYYY-MM'), to_char(_de, 'YYYY'), _snapshot, uid, nome, now(),
    _de, _ate, _qtd, _total, _arquivo_url
  ) RETURNING id INTO _id;

  DELETE FROM public.provisao_diaria WHERE data BETWEEN _de AND _ate;

  PERFORM public.registrar_acao_critica(
    'fechamento_competencia', 'Provisão Diária', 'provisao_fechamento_competencia', _id::text,
    format('Fechamento "%s" do período %s a %s: %s registro(s), total %s, processado por %s em %s',
           _nome, to_char(_de, 'DD/MM/YYYY'), to_char(_ate, 'DD/MM/YYYY'), _qtd, _total, nome,
           to_char(now(), 'DD/MM/YYYY HH24:MI:SS')),
    NULL, NULL,
    jsonb_build_object('periodo_inicio', _de, 'periodo_fim', _ate,
                       'total_registros', _qtd, 'total_valor', _total,
                       'arquivo_url', _arquivo_url, 'usuario', nome,
                       'executado_em', now()),
    'critico'
  );

  RETURN _id;
END;
$function$;

REVOKE ALL ON FUNCTION public.fechar_competencia_provisao_periodo(text, date, date, text) FROM public;
GRANT EXECUTE ON FUNCTION public.fechar_competencia_provisao_periodo(text, date, date, text) TO authenticated;