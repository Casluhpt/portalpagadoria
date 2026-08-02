
-- Add month column to provisao_diaria for segmentation
ALTER TABLE public.provisao_diaria ADD COLUMN IF NOT EXISTS mes text;

-- Create provisao_fechamento_competencia table to store archived competences
CREATE TABLE IF NOT EXISTS public.provisao_fechamento_competencia (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    mes text NOT NULL,
    ano text NOT NULL,
    data_fechamento timestamp with time zone DEFAULT now(),
    fechado_por uuid REFERENCES auth.users(id),
    snapshot jsonb NOT NULL,
    arquivo_url text
);

GRANT SELECT, INSERT ON public.provisao_fechamento_competencia TO authenticated;
GRANT ALL ON public.provisao_fechamento_competencia TO service_role;

-- Function to integrate lancamentos into provisao_diaria
CREATE OR REPLACE FUNCTION public.integrar_pagamentos_na_provisao()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    today_date date := current_date;
BEGIN
    -- Insert from lancamentos into provisao_diaria
    INSERT INTO public.provisao_diaria (data, empresa, banco, valor, mes)
    select 
        l.due_date::date,
        l.empresa,
        COALESCE(l.supplier, 'DIVERSOS'),
        l.gross_amount,
        to_char(l.due_date::date, 'YYYY-MM')
    from public.lancamentos l
    where l.due_date::date = today_date
    ON CONFLICT DO NOTHING;
END;
$$;

-- RPC to perform closure and archiving
CREATE OR REPLACE FUNCTION public.fechar_competencia_provisao(_nome text, _mes text, _ano text, _usuario_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _new_id uuid;
    _snapshot jsonb;
BEGIN
    -- Create snapshot
    SELECT jsonb_agg(t) INTO _snapshot FROM (SELECT * FROM public.provisao_diaria WHERE mes = _mes) t;
    
    -- Insert into history
    INSERT INTO public.provisao_fechamento_competencia (nome, mes, ano, fechado_por, snapshot)
    VALUES (_nome, _mes, _ano, _usuario_id, COALESCE(_snapshot, '[]'::jsonb))
    RETURNING id INTO _new_id;
    
    -- Clear current base for that month
    DELETE FROM public.provisao_diaria WHERE mes = _mes;
    
    RETURN _new_id;
END;
$$;
