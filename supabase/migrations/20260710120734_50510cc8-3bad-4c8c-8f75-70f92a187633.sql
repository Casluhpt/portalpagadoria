
ALTER TABLE public.pagamentos_diversos DROP COLUMN diferenca_lg_finnet;
ALTER TABLE public.pagamentos_diversos DROP COLUMN diferenca_bank_itau;

ALTER TABLE public.pagamentos_diversos
  ALTER COLUMN valor_lg TYPE numeric(20,2),
  ALTER COLUMN valor_bankmanager TYPE numeric(20,2),
  ALTER COLUMN valor_itau TYPE numeric(20,2),
  ALTER COLUMN ev_saida_folha_mensal TYPE bigint,
  ALTER COLUMN qtde_colaboradores TYPE bigint,
  ALTER COLUMN competencia_ano TYPE bigint;

ALTER TABLE public.pagamentos_diversos
  ADD COLUMN diferenca_lg_finnet numeric(20,2)
    GENERATED ALWAYS AS (COALESCE(valor_lg, 0::numeric) - COALESCE(valor_bankmanager, 0::numeric)) STORED,
  ADD COLUMN diferenca_bank_itau numeric(20,2)
    GENERATED ALWAYS AS (COALESCE(valor_bankmanager, 0::numeric) - COALESCE(valor_itau, 0::numeric)) STORED;
