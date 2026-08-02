-- 1. Remove duplicates keeping only the latest entry per bank/company/date
DELETE FROM public.provisao_diaria
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY data, empresa, banco 
                   ORDER BY id DESC
               ) as row_num
        FROM public.provisao_diaria
    ) t
    WHERE t.row_num > 1
);

-- 2. Fill missing 'mes' values based on 'data' if any remain empty
UPDATE public.provisao_diaria
SET mes = to_char(data, 'YYYY-MM')
WHERE mes IS NULL OR mes = '';

-- 3. Add NOT NULL constraint to 'mes'
ALTER TABLE public.provisao_diaria ALTER COLUMN mes SET NOT NULL;

-- 4. Create a unique constraint to prevent future duplication
ALTER TABLE public.provisao_diaria 
ADD CONSTRAINT provisao_diaria_unique_entry UNIQUE (data, empresa, banco);

-- 5. Add index for performance
CREATE INDEX IF NOT EXISTS idx_provisao_diaria_data ON public.provisao_diaria(data);
CREATE INDEX IF NOT EXISTS idx_provisao_diaria_mes ON public.provisao_diaria(mes);

-- 6. Grant permissions (safety)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provisao_diaria TO authenticated;
GRANT ALL ON public.provisao_diaria TO service_role;