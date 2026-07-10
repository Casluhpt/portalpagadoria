DROP POLICY IF EXISTS "Public read access" ON public.lancamentos;
DROP POLICY IF EXISTS "Public read access" ON public.provisao_diaria;
CREATE POLICY "Authenticated read access" ON public.lancamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON public.provisao_diaria FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.lancamentos FROM anon;
REVOKE SELECT ON public.provisao_diaria FROM anon;