-- Fix overly permissive policies
DROP POLICY "public insert solicitacoes" ON public.solicitacoes;
CREATE POLICY "Admins can insert solicitacoes" ON public.solicitacoes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'administrador'));

DROP POLICY "public read solicitacoes" ON public.solicitacoes;
CREATE POLICY "Admins can view solicitacoes" ON public.solicitacoes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'administrador') OR public.has_role(auth.uid(), 'auditor'));

DROP POLICY "public read updates" ON public.solicitacao_updates;
CREATE POLICY "Admins can view updates" ON public.solicitacao_updates FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'administrador') OR public.has_role(auth.uid(), 'auditor'));

DROP POLICY "auth insert audit lancamentos" ON public.lancamentos_audit;
CREATE POLICY "Only admins can insert audit lancamentos" ON public.lancamentos_audit FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'administrador'));

DROP POLICY "Authenticated write lancamentos" ON public.lancamentos;
CREATE POLICY "Admins can manage lancamentos" ON public.lancamentos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'administrador')) WITH CHECK (public.has_role(auth.uid(), 'administrador'));

DROP POLICY "Autenticados podem inserir despesas fixas" ON public.despesas_fixas;
CREATE POLICY "Admins can insert despesas fixas" ON public.despesas_fixas FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'administrador'));

DROP POLICY "Autenticados podem atualizar despesas fixas" ON public.despesas_fixas;
CREATE POLICY "Admins can update despesas fixas" ON public.despesas_fixas FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'administrador')) WITH CHECK (public.has_role(auth.uid(), 'administrador'));

DROP POLICY "Authenticated read profiles" ON public.profiles;
CREATE POLICY "Users can read their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'administrador'));

DROP POLICY "auth insert audit" ON public.pagamentos_audit;
CREATE POLICY "Admins can insert pagamentos audit" ON public.pagamentos_audit FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'administrador'));

-- Revoke anon access to most tables
REVOKE ALL ON public.solicitacoes FROM anon;
REVOKE ALL ON public.solicitacao_updates FROM anon;
REVOKE ALL ON public.lancamentos FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.app_versions FROM anon;
REVOKE ALL ON public.despesas_fixas FROM anon;
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.provisao_diaria FROM anon;
REVOKE ALL ON public.pagamentos_diversos FROM anon;
