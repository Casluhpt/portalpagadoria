CREATE OR REPLACE FUNCTION public.purgar_logs_auditoria(_ids uuid[], _justificativa text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _n integer := 0;
  _m integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'administrador') THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir logs de auditoria.';
  END IF;
  IF _ids IS NULL OR array_length(_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;
  IF coalesce(btrim(_justificativa), '') = '' THEN
    RAISE EXCEPTION 'Justificativa obrigatória para exclusão permanente.';
  END IF;

  DELETE FROM public.pagamentos_audit WHERE id = ANY(_ids);
  GET DIAGNOSTICS _n = ROW_COUNT;

  DELETE FROM public.lancamentos_audit WHERE id = ANY(_ids);
  GET DIAGNOSTICS _m = ROW_COUNT;

  PERFORM public.registrar_acao_critica(
    'exclusao_logs_auditoria', 'auditoria', 'pagamentos_audit', NULL,
    format('Exclusão permanente de %s registro(s) do log de auditoria', _n + _m),
    _justificativa, to_jsonb(_ids), NULL, 'critico'
  );

  RETURN _n + _m;
END;
$function$;

REVOKE ALL ON FUNCTION public.purgar_logs_auditoria(uuid[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purgar_logs_auditoria(uuid[], text) TO authenticated;