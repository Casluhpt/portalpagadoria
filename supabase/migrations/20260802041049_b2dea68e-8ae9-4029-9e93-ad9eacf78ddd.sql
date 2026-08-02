-- Final security tightening for functions
-- Revoke all execute from authenticated to re-grant only where necessary for security definer functions
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

-- Public/Anon access only for role check
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;

-- System/Internal triggers - restrict to service_role and authenticated (where triggers run as user)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user_password_metadata() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_viewer_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.lancamentos_audit_fn() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pagamentos_audit_fn() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_pagamento_to_provisao() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pagamentos_bloqueio_provisao_fechada() TO authenticated, service_role;

-- Application logic functions - only for authenticated users
GRANT EXECUTE ON FUNCTION public.aprovar_solicitacao_provisao(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rejeitar_solicitacao_provisao(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.integrar_pagamentos_na_provisao() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reabrir_provisao_diaria(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fechar_provisao_diaria(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fechar_competencia_provisao(text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_provisao_fechada(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_password_changed() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_presence(text) TO authenticated;

-- Security Invoker functions are generally safe to be executed by authenticated
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.solicitacoes_assign_codigo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pagamentos_diversos_touch() TO authenticated;
GRANT EXECUTE ON FUNCTION public.password_metadata_touch() TO authenticated;

-- Ensure search_path is set for all SECURITY DEFINER functions to prevent path hijacking
ALTER FUNCTION public.aprovar_solicitacao_provisao(uuid, text) SET search_path = public;
ALTER FUNCTION public.rejeitar_solicitacao_provisao(uuid, text) SET search_path = public;
ALTER FUNCTION public.integrar_pagamentos_na_provisao() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.sync_pagamento_to_provisao() SET search_path = public;
ALTER FUNCTION public.reabrir_provisao_diaria(date) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.ensure_viewer_role() SET search_path = public;
ALTER FUNCTION public.handle_new_user_password_metadata() SET search_path = public;
ALTER FUNCTION public.pagamentos_bloqueio_provisao_fechada() SET search_path = public;
ALTER FUNCTION public.is_provisao_fechada(date) SET search_path = public;
ALTER FUNCTION public.fechar_provisao_diaria(date) SET search_path = public;
ALTER FUNCTION public.mark_password_changed() SET search_path = public;
ALTER FUNCTION public.set_presence(text) SET search_path = public;
ALTER FUNCTION public.lancamentos_audit_fn() SET search_path = public;
ALTER FUNCTION public.pagamentos_audit_fn() SET search_path = public;
