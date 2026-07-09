-- Lock writes on financial tables to authenticated users; keep reads public.

-- lancamentos
DROP POLICY IF EXISTS "Public insert access" ON public.lancamentos;
DROP POLICY IF EXISTS "Public update access" ON public.lancamentos;
DROP POLICY IF EXISTS "Public delete access" ON public.lancamentos;

CREATE POLICY "Authenticated can insert lancamentos"
  ON public.lancamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update lancamentos"
  ON public.lancamentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete lancamentos"
  ON public.lancamentos FOR DELETE TO authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON public.lancamentos FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos TO authenticated;

-- provisao_diaria
DROP POLICY IF EXISTS "Public insert access" ON public.provisao_diaria;
DROP POLICY IF EXISTS "Public update access" ON public.provisao_diaria;
DROP POLICY IF EXISTS "Public delete access" ON public.provisao_diaria;

CREATE POLICY "Authenticated can insert provisao"
  ON public.provisao_diaria FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update provisao"
  ON public.provisao_diaria FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete provisao"
  ON public.provisao_diaria FOR DELETE TO authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON public.provisao_diaria FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provisao_diaria TO authenticated;
