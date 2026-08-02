
CREATE TABLE public.fechamento_pagamentos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    mes text NOT NULL,
    ano text NOT NULL,
    usuario_id uuid REFERENCES auth.users(id),
    criado_em timestamptz DEFAULT now(),
    arquivo_url text,
    total_valor numeric(20, 2) DEFAULT 0,
    total_registros integer DEFAULT 0
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fechamento_pagamentos TO authenticated;
GRANT ALL ON public.fechamento_pagamentos TO service_role;

ALTER TABLE public.fechamento_pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all closures"
ON public.fechamento_pagamentos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage closures"
ON public.fechamento_pagamentos FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));
