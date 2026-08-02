ALTER TABLE public.provisao_fechamento_competencia ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.provisao_fechamento_competencia TO authenticated;
GRANT ALL ON public.provisao_fechamento_competencia TO service_role;

CREATE POLICY "Admins can manage closure history" 
ON public.provisao_fechamento_competencia
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Auditors can view closure history" 
ON public.provisao_fechamento_competencia
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'auditor'));

ALTER FUNCTION public.fechar_competencia_provisao SET search_path = public;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

GRANT EXECUTE ON FUNCTION public.has_role TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user_password_metadata TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_viewer_role TO authenticated, service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;