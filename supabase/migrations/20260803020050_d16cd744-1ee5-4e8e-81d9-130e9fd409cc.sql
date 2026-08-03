-- 1. despesas_fixas_notas
DROP POLICY IF EXISTS "Users can manage notes for their expenses" ON public.despesas_fixas_notas;
CREATE POLICY "Autenticados podem ver notas"
  ON public.despesas_fixas_notas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operacional pode inserir notas"
  ON public.despesas_fixas_notas FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'administrador')
    OR public.has_role(auth.uid(), 'operacional')
    OR public.has_role(auth.uid(), 'criador_competencia')
  );
CREATE POLICY "Operacional pode atualizar notas"
  ON public.despesas_fixas_notas FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrador')
    OR public.has_role(auth.uid(), 'operacional')
    OR public.has_role(auth.uid(), 'criador_competencia')
  );
CREATE POLICY "Operacional pode excluir notas"
  ON public.despesas_fixas_notas FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrador')
    OR public.has_role(auth.uid(), 'operacional')
    OR public.has_role(auth.uid(), 'criador_competencia')
  );

-- 2. concorrencia_fila (fila virtual: leitura coletiva, escrita apenas da própria entrada)
DROP POLICY IF EXISTS "Public queue access" ON public.concorrencia_fila;
CREATE POLICY "Autenticados podem ver a fila"
  ON public.concorrencia_fila FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuario entra na fila por si"
  ON public.concorrencia_fila FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuario atualiza sua entrada na fila"
  ON public.concorrencia_fila FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'administrador'));
CREATE POLICY "Usuario sai da fila"
  ON public.concorrencia_fila FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'administrador'));

-- 3. esocial_base (dados fiscais sensíveis)
DROP POLICY IF EXISTS "Usuários autenticados podem ver base esocial" ON public.esocial_base;
CREATE POLICY "Perfis autorizados podem ver base esocial"
  ON public.esocial_base FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrador')
    OR public.has_role(auth.uid(), 'auditor')
    OR public.has_role(auth.uid(), 'operacional')
    OR public.has_role(auth.uid(), 'consulta')
  );

-- 4. pedidos_orcamento
DROP POLICY IF EXISTS "Auth access" ON public.pedidos_orcamento;
DROP POLICY IF EXISTS "Users can view and manage order budgets" ON public.pedidos_orcamento;
CREATE POLICY "Autenticados podem ver pedidos"
  ON public.pedidos_orcamento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operacional pode inserir pedidos"
  ON public.pedidos_orcamento FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'administrador')
    OR public.has_role(auth.uid(), 'operacional')
    OR public.has_role(auth.uid(), 'criador_competencia')
  );
CREATE POLICY "Operacional pode atualizar pedidos"
  ON public.pedidos_orcamento FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrador')
    OR public.has_role(auth.uid(), 'operacional')
    OR public.has_role(auth.uid(), 'criador_competencia')
  );
CREATE POLICY "Operacional pode excluir pedidos"
  ON public.pedidos_orcamento FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrador')
    OR public.has_role(auth.uid(), 'operacional')
    OR public.has_role(auth.uid(), 'criador_competencia')
  );

-- 5. Storage: acesso por propriedade do arquivo (pasta = user id) ou administrador
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual ILIKE '%suporte_anexos%' OR with_check ILIKE '%suporte_anexos%'
        OR qual ILIKE '%fechamentos%' OR with_check ILIKE '%fechamentos%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "Anexos: dono ou admin le"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('suporte_anexos', 'fechamentos')
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR owner = auth.uid()
      OR public.has_role(auth.uid(), 'administrador')
    )
  );

CREATE POLICY "Anexos: dono envia na propria pasta"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('suporte_anexos', 'fechamentos')
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'administrador')
    )
  );

CREATE POLICY "Anexos: dono ou admin atualiza"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('suporte_anexos', 'fechamentos')
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR owner = auth.uid()
      OR public.has_role(auth.uid(), 'administrador')
    )
  );

CREATE POLICY "Anexos: dono ou admin exclui"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('suporte_anexos', 'fechamentos')
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR owner = auth.uid()
      OR public.has_role(auth.uid(), 'administrador')
    )
  );