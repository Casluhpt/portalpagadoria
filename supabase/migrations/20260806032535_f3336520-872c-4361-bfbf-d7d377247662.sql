ALTER TABLE public.pagamentos_diversos ADD COLUMN IF NOT EXISTS excluido_em TIMESTAMPTZ;
ALTER TABLE public.pagamentos_diversos ADD COLUMN IF NOT EXISTS excluido_por UUID REFERENCES auth.users(id);

-- Atualiza a função de purga bulk para realizar exclusão lógica em vez de física
-- (Nota: A função do servidor purgarPagamentosBulkFn em src/lib/pagamentos-admin.functions.ts 
-- já chama o supabaseAdmin que faria o delete físico se não alterarmos o código lá também)
