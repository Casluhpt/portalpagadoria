DROP POLICY IF EXISTS "Authenticated read access" ON public.provisao_diaria;
DROP POLICY IF EXISTS "authenticated read provisao" ON public.provisao_diaria;
DROP POLICY IF EXISTS "Authenticated write provisao" ON public.provisao_diaria;

CREATE POLICY "admin read provisao"
ON public.provisao_diaria
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role));