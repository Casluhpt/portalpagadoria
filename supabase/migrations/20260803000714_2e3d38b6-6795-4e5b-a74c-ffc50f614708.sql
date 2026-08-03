CREATE OR REPLACE FUNCTION public.audit_log_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' AND coalesce(current_setting('app.purge_audit', true), '') = 'on' THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'LOG_IMUTAVEL: registros de auditoria não podem ser alterados ou removidos.';
END;
$function$;

CREATE OR REPLACE FUNCTION public.purgar_acoes_criticas(_ids uuid[], _justificativa text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _n integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'administrador') THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir registros de auditoria.';
  END IF;
  IF _ids IS NULL OR array_length(_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;
  IF coalesce(btrim(_justificativa), '') = '' THEN
    RAISE EXCEPTION 'Justificativa obrigatória para exclusão permanente.';
  END IF;

  PERFORM set_config('app.purge_audit', 'on', true);
  DELETE FROM public.audit_log WHERE id = ANY(_ids);
  GET DIAGNOSTICS _n = ROW_COUNT;
  PERFORM set_config('app.purge_audit', 'off', true);

  RETURN _n;
END;
$function$;

REVOKE ALL ON FUNCTION public.purgar_acoes_criticas(uuid[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purgar_acoes_criticas(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purgar_acoes_criticas(uuid[], text) TO service_role;