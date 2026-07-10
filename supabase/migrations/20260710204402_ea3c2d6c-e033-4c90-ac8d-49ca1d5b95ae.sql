ALTER TABLE public.despesas_fixas
  ADD COLUMN IF NOT EXISTS nome_real text,
  ADD COLUMN IF NOT EXISTS notas text;