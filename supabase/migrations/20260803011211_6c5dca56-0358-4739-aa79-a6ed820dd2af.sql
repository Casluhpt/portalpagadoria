CREATE TABLE public.app_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role public.app_role NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  is_allowed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, resource, action)
);

GRANT SELECT ON public.app_permissions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_permissions TO authenticated;
GRANT ALL ON public.app_permissions TO service_role;

ALTER TABLE public.app_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver permissoes"
  ON public.app_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins gerenciam permissoes"
  ON public.app_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE TRIGGER app_permissions_touch
  BEFORE UPDATE ON public.app_permissions
  FOR EACH ROW EXECUTE FUNCTION public.pagamentos_diversos_touch();

INSERT INTO public.app_permissions (role, resource, action, is_allowed)
SELECT r.role, res.resource, act.action,
  CASE
    WHEN r.role = 'administrador' THEN true
    WHEN act.action = 'view' AND r.role IN ('operacional','criador_competencia','consulta','auditor','viewer','visitante') THEN true
    WHEN act.action IN ('create','edit') AND r.role IN ('operacional','criador_competencia') THEN true
    ELSE false
  END
FROM (SELECT unnest(ARRAY['administrador','criador_competencia','operacional','consulta','auditor','viewer','visitante']::public.app_role[]) AS role) r
CROSS JOIN (SELECT unnest(ARRAY['pagamentos','lancamentos','provisao','despesas_fixas','aprovacoes','esocial','conciliacao','fechamento','auditoria','material_apoio','resultados','configuracoes']) AS resource) res
CROSS JOIN (SELECT unnest(ARRAY['view','create','edit','delete','import','export']) AS action) act;