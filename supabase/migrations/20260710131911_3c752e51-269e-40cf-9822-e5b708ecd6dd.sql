
DROP POLICY IF EXISTS "auth read audit" ON public.pagamentos_audit;

CREATE POLICY "Admins e auditores leem auditoria"
ON public.pagamentos_audit
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'administrador'::public.app_role)
  OR public.has_role(auth.uid(), 'auditor'::public.app_role)
);
