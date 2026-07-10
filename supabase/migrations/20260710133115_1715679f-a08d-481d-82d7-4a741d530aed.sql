
-- Add link column to trace origin of provisao rows
ALTER TABLE public.provisao_diaria
  ADD COLUMN IF NOT EXISTS pagamento_id uuid UNIQUE REFERENCES public.pagamentos_diversos(id) ON DELETE CASCADE;

-- Sync function: mirrors data_credito, empresa, banco, valor_lg into provisao_diaria
CREATE OR REPLACE FUNCTION public.sync_pagamento_to_provisao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    DELETE FROM public.provisao_diaria WHERE pagamento_id = OLD.id;
    RETURN OLD;
  END IF;

  -- INSERT or UPDATE
  IF NEW.data_credito IS NULL THEN
    -- Sem data de crédito, remove eventual espelho
    DELETE FROM public.provisao_diaria WHERE pagamento_id = NEW.id;
    RETURN NEW;
  END IF;

  INSERT INTO public.provisao_diaria (pagamento_id, data, empresa, banco, valor)
  VALUES (NEW.id, NEW.data_credito, NEW.empresa, NEW.banco, NEW.valor_lg)
  ON CONFLICT (pagamento_id) DO UPDATE
    SET data = EXCLUDED.data,
        empresa = EXCLUDED.empresa,
        banco = EXCLUDED.banco,
        valor = EXCLUDED.valor,
        updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_pagamento_to_provisao_trg ON public.pagamentos_diversos;
CREATE TRIGGER sync_pagamento_to_provisao_trg
AFTER INSERT OR UPDATE OF data_credito, empresa, banco, valor_lg OR DELETE
ON public.pagamentos_diversos
FOR EACH ROW EXECUTE FUNCTION public.sync_pagamento_to_provisao();

-- Backfill existing pagamentos into provisao_diaria
INSERT INTO public.provisao_diaria (pagamento_id, data, empresa, banco, valor)
SELECT p.id, p.data_credito, p.empresa, p.banco, p.valor_lg
FROM public.pagamentos_diversos p
WHERE p.data_credito IS NOT NULL
ON CONFLICT (pagamento_id) DO UPDATE
  SET data = EXCLUDED.data,
      empresa = EXCLUDED.empresa,
      banco = EXCLUDED.banco,
      valor = EXCLUDED.valor,
      updated_at = now();
