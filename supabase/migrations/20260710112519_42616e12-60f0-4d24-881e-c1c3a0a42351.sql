CREATE POLICY "authenticated insert own comunicados"
ON public.comunicados
FOR INSERT
TO authenticated
WITH CHECK (criado_por = auth.uid());