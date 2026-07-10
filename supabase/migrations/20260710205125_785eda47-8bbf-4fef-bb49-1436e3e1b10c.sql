ALTER TABLE public.despesas_fixas ADD COLUMN IF NOT EXISTS ordem INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_despesas_fixas_ordem ON public.despesas_fixas (categoria, ordem);
DELETE FROM public.despesas_fixas WHERE ano = 2026;