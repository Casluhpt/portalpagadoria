-- Fix the rest of the permissive policies
DROP POLICY "auth insert pagamentos" ON public.pagamentos_diversos;
CREATE POLICY "Admins can insert pagamentos" ON public.pagamentos_diversos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'administrador'));

DROP POLICY "auth update pagamentos" ON public.pagamentos_diversos;
CREATE POLICY "Admins can update pagamentos" ON public.pagamentos_diversos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'administrador')) WITH CHECK (public.has_role(auth.uid(), 'administrador'));

DROP POLICY "auth delete pagamentos" ON public.pagamentos_diversos;
CREATE POLICY "Admins can delete pagamentos" ON public.pagamentos_diversos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'administrador'));

DROP POLICY "aprov_insert" ON public.aprovacoes;
CREATE POLICY "Admins can insert aprovacoes" ON public.aprovacoes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'administrador'));

DROP POLICY "aprov_update" ON public.aprovacoes;
CREATE POLICY "Admins can update aprovacoes" ON public.aprovacoes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'administrador')) WITH CHECK (public.has_role(auth.uid(), 'administrador'));

-- Revoke all execute from anon one more time just to be sure
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated, anon;
