-- Fix RLS policy for concorrencia_fila to ensure users can insert their own records
-- The previous policy might have been too restrictive or had issues with the check condition.

DROP POLICY IF EXISTS "Usuario entra na fila por si" ON public.concorrencia_fila;

CREATE POLICY "Usuario entra na fila por si"
  ON public.concorrencia_fila FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ensure service_role can always bypass if needed (though createServerFn uses the user client by default)
GRANT ALL ON public.concorrencia_fila TO service_role;
GRANT ALL ON public.concorrencia_fila TO authenticated;
