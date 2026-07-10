
ALTER TABLE public.despesas_fixas
  ADD COLUMN IF NOT EXISTS numero_pedido TEXT,
  ADD COLUMN IF NOT EXISTS numero_nf TEXT,
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'mensal',
  ADD COLUMN IF NOT EXISTS data_lancamento DATE,
  ADD COLUMN IF NOT EXISTS data_vencimento DATE,
  ADD COLUMN IF NOT EXISTS conta TEXT,
  ADD COLUMN IF NOT EXISTS centro_custo TEXT,
  ADD COLUMN IF NOT EXISTS empresa_codigo TEXT,
  ADD COLUMN IF NOT EXISTS empresa_nome TEXT,
  ADD COLUMN IF NOT EXISTS lancado BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.despesas_fixas
  DROP CONSTRAINT IF EXISTS despesas_fixas_tipo_check;
ALTER TABLE public.despesas_fixas
  ADD CONSTRAINT despesas_fixas_tipo_check CHECK (tipo IN ('mensal','adiantamento'));
