CREATE OR REPLACE FUNCTION public.sync_pagamento_to_provisao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  empresa_norm TEXT;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    DELETE FROM public.provisao_diaria WHERE pagamento_id = OLD.id;
    RETURN OLD;
  END IF;

  IF NEW.data_credito IS NULL THEN
    DELETE FROM public.provisao_diaria WHERE pagamento_id = NEW.id;
    RETURN NEW;
  END IF;

  -- Normaliza TAMOIO 16..44 (e variações) para apenas "TAMOIO"
  empresa_norm := NEW.empresa;
  IF empresa_norm IS NOT NULL AND upper(btrim(empresa_norm)) ~ '^TAMOIO\s*(1[6-9]|2[0-9]|3[0-9]|4[0-4])\M' THEN
    empresa_norm := 'TAMOIO';
  END IF;

  INSERT INTO public.provisao_diaria (pagamento_id, data, empresa, banco, valor)
  VALUES (NEW.id, NEW.data_credito, empresa_norm, NEW.banco, NEW.valor_lg)
  ON CONFLICT (pagamento_id) DO UPDATE
    SET data = EXCLUDED.data,
        empresa = EXCLUDED.empresa,
        banco = EXCLUDED.banco,
        valor = EXCLUDED.valor,
        updated_at = now();
  RETURN NEW;
END;
$function$;

-- Normaliza registros já existentes na base de provisão
UPDATE public.provisao_diaria
SET empresa = 'TAMOIO'
WHERE empresa IS NOT NULL
  AND upper(btrim(empresa)) ~ '^TAMOIO\s*(1[6-9]|2[0-9]|3[0-9]|4[0-4])\M';