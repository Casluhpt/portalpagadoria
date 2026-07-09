
CREATE TABLE public.pagamentos_diversos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registrado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  colaborador_nome TEXT NOT NULL,
  registrado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  celula TEXT,
  arquivo_remessa TEXT,
  tipo_arquivo TEXT,
  ev_saida_folha_mensal INTEGER,
  banco TEXT,
  empresa TEXT,
  data_credito DATE,
  descricao_pagamento TEXT,
  valor_lg NUMERIC(14,2),
  competencia TEXT,
  competencia_ano INTEGER,
  folha TEXT,
  qtde_colaboradores INTEGER,
  observacao TEXT,
  valor_bankmanager NUMERIC(14,2),
  status_bankmanager TEXT,
  diferenca_lg_finnet NUMERIC(14,2) GENERATED ALWAYS AS (COALESCE(valor_lg,0) - COALESCE(valor_bankmanager,0)) STORED,
  valor_itau NUMERIC(14,2),
  status_itau TEXT,
  diferenca_bank_itau NUMERIC(14,2) GENERATED ALWAYS AS (COALESCE(valor_bankmanager,0) - COALESCE(valor_itau,0)) STORED,
  natureza_pagamento TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagamentos_diversos TO authenticated;
GRANT ALL ON public.pagamentos_diversos TO service_role;
ALTER TABLE public.pagamentos_diversos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read pagamentos" ON public.pagamentos_diversos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert pagamentos" ON public.pagamentos_diversos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update pagamentos" ON public.pagamentos_diversos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete pagamentos" ON public.pagamentos_diversos FOR DELETE TO authenticated USING (true);

CREATE INDEX pagamentos_diversos_data_idx ON public.pagamentos_diversos(data_credito);
CREATE INDEX pagamentos_diversos_empresa_idx ON public.pagamentos_diversos(empresa);
CREATE INDEX pagamentos_diversos_competencia_idx ON public.pagamentos_diversos(competencia_ano, competencia);

CREATE OR REPLACE FUNCTION public.pagamentos_diversos_touch() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER pagamentos_diversos_touch_trg BEFORE UPDATE ON public.pagamentos_diversos
FOR EACH ROW EXECUTE FUNCTION public.pagamentos_diversos_touch();

CREATE TABLE public.pagamentos_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pagamento_id UUID,
  acao TEXT NOT NULL,
  user_id UUID,
  user_nome TEXT,
  snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.pagamentos_audit TO authenticated;
GRANT ALL ON public.pagamentos_audit TO service_role;
ALTER TABLE public.pagamentos_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read audit" ON public.pagamentos_audit FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert audit" ON public.pagamentos_audit FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX pagamentos_audit_pag_idx ON public.pagamentos_audit(pagamento_id);
CREATE INDEX pagamentos_audit_created_idx ON public.pagamentos_audit(created_at DESC);

CREATE OR REPLACE FUNCTION public.pagamentos_audit_fn() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE nome TEXT;
BEGIN
  SELECT COALESCE(p.nome, u.email) INTO nome
  FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = auth.uid();

  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.pagamentos_audit(pagamento_id, acao, user_id, user_nome, snapshot)
    VALUES (OLD.id, 'DELETE', auth.uid(), nome, to_jsonb(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.pagamentos_audit(pagamento_id, acao, user_id, user_nome, snapshot)
    VALUES (NEW.id, 'UPDATE', auth.uid(), nome, to_jsonb(NEW));
    RETURN NEW;
  ELSE
    INSERT INTO public.pagamentos_audit(pagamento_id, acao, user_id, user_nome, snapshot)
    VALUES (NEW.id, 'INSERT', auth.uid(), nome, to_jsonb(NEW));
    RETURN NEW;
  END IF;
END; $$;

CREATE TRIGGER pagamentos_audit_trg
AFTER INSERT OR UPDATE OR DELETE ON public.pagamentos_diversos
FOR EACH ROW EXECUTE FUNCTION public.pagamentos_audit_fn();
