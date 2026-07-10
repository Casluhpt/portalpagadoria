
-- =========================================================
-- 1) Tabela de fechamentos diários da provisão
-- =========================================================
CREATE TABLE IF NOT EXISTS public.provisao_fechamentos (
  data DATE PRIMARY KEY,
  fechada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  fechada_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fechada_por_nome TEXT
);

GRANT SELECT ON public.provisao_fechamentos TO authenticated;
GRANT ALL ON public.provisao_fechamentos TO service_role;

ALTER TABLE public.provisao_fechamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth users can read fechamentos"
  ON public.provisao_fechamentos FOR SELECT
  TO authenticated
  USING (true);

-- =========================================================
-- 2) Tabela de solicitações (divergências de provisão fechada)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.pagamento_solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  solicitante_nome TEXT,
  data_credito DATE NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  motivo TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovada','rejeitada')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  decidido_em TIMESTAMPTZ,
  decidido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decidido_por_nome TEXT,
  motivo_decisao TEXT,
  pagamento_id UUID
);

GRANT SELECT, INSERT, UPDATE ON public.pagamento_solicitacoes TO authenticated;
GRANT ALL ON public.pagamento_solicitacoes TO service_role;

ALTER TABLE public.pagamento_solicitacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user reads own solicitacoes"
  ON public.pagamento_solicitacoes FOR SELECT
  TO authenticated
  USING (solicitante_id = auth.uid() OR public.has_role(auth.uid(),'administrador'));

CREATE POLICY "user creates own solicitacoes"
  ON public.pagamento_solicitacoes FOR INSERT
  TO authenticated
  WITH CHECK (solicitante_id = auth.uid());

CREATE POLICY "admin updates solicitacoes"
  ON public.pagamento_solicitacoes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(),'administrador'))
  WITH CHECK (public.has_role(auth.uid(),'administrador'));

CREATE INDEX IF NOT EXISTS idx_pag_solic_status ON public.pagamento_solicitacoes(status, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_pag_solic_solicitante ON public.pagamento_solicitacoes(solicitante_id, criado_em DESC);

-- =========================================================
-- 3) Trigger de bloqueio: impede lançar em dia com provisão fechada
-- =========================================================
CREATE OR REPLACE FUNCTION public.pagamentos_bloqueio_provisao_fechada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bypass TEXT;
  changed BOOLEAN;
  fechada RECORD;
BEGIN
  -- Bypass interno usado pela aprovação do administrador
  bypass := current_setting('app.provisao_bypass', true);
  IF bypass = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.data_credito IS NULL THEN
    RETURN NEW;
  END IF;

  IF (TG_OP = 'INSERT') THEN
    changed := true;
  ELSE
    changed := (OLD.data_credito IS DISTINCT FROM NEW.data_credito);
  END IF;

  IF NOT changed THEN
    RETURN NEW;
  END IF;

  SELECT * INTO fechada FROM public.provisao_fechamentos WHERE data = NEW.data_credito;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'PROVISAO_FECHADA:%', to_char(NEW.data_credito, 'YYYY-MM-DD')
    USING ERRCODE = 'P0001';
END;
$$;

DROP TRIGGER IF EXISTS trg_pagamentos_bloqueio_provisao ON public.pagamentos_diversos;
CREATE TRIGGER trg_pagamentos_bloqueio_provisao
  BEFORE INSERT OR UPDATE OF data_credito ON public.pagamentos_diversos
  FOR EACH ROW EXECUTE FUNCTION public.pagamentos_bloqueio_provisao_fechada();

-- =========================================================
-- 4) Funções auxiliares
-- =========================================================

-- Fechar provisão do dia (admin)
CREATE OR REPLACE FUNCTION public.fechar_provisao_diaria(_data DATE DEFAULT CURRENT_DATE)
RETURNS public.provisao_fechamentos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  nome TEXT;
  row public.provisao_fechamentos;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'administrador') THEN
    RAISE EXCEPTION 'Apenas administradores podem fechar a provisão.';
  END IF;

  SELECT COALESCE(p.nome, u.email) INTO nome
  FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = uid;

  INSERT INTO public.provisao_fechamentos(data, fechada_em, fechada_por, fechada_por_nome)
  VALUES (_data, now(), uid, nome)
  ON CONFLICT (data) DO UPDATE
    SET fechada_em = EXCLUDED.fechada_em,
        fechada_por = EXCLUDED.fechada_por,
        fechada_por_nome = EXCLUDED.fechada_por_nome
  RETURNING * INTO row;
  RETURN row;
END;
$$;

-- Reabrir provisão do dia (admin)
CREATE OR REPLACE FUNCTION public.reabrir_provisao_diaria(_data DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid UUID := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'administrador') THEN
    RAISE EXCEPTION 'Apenas administradores podem reabrir a provisão.';
  END IF;
  DELETE FROM public.provisao_fechamentos WHERE data = _data;
END;
$$;

-- Consulta rápida
CREATE OR REPLACE FUNCTION public.is_provisao_fechada(_data DATE)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.provisao_fechamentos WHERE data = _data);
$$;

-- Aprovar solicitação: insere pagamento com bypass e marca como aprovada
CREATE OR REPLACE FUNCTION public.aprovar_solicitacao_provisao(_id UUID, _motivo TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  nome TEXT;
  s public.pagamento_solicitacoes;
  novo_id UUID;
  cols TEXT;
  vals TEXT;
  sql TEXT;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'administrador') THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar solicitações.';
  END IF;

  SELECT * INTO s FROM public.pagamento_solicitacoes WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada.'; END IF;
  IF s.status <> 'pendente' THEN RAISE EXCEPTION 'Solicitação já foi decidida.'; END IF;

  SELECT COALESCE(p.nome, u.email) INTO nome
  FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = uid;

  -- Bypass do trigger durante essa transação
  PERFORM set_config('app.provisao_bypass', 'on', true);

  INSERT INTO public.pagamentos_diversos (
    celula, arquivo_remessa, tipo_arquivo, ev_saida_folha_mensal, banco, empresa,
    data_credito, descricao_pagamento, valor_lg, competencia, folha,
    qtde_colaboradores, observacao, valor_bankmanager, status_bankmanager, valor_itau,
    status_itau, natureza_pagamento,
    colaborador_nome, registrado_por, registrado_em
  )
  VALUES (
    NULLIF(s.payload->>'celula',''),
    NULLIF(s.payload->>'arquivo_remessa',''),
    NULLIF(s.payload->>'tipo_arquivo',''),
    NULLIF(s.payload->>'ev_saida_folha_mensal',''),
    NULLIF(s.payload->>'banco',''),
    NULLIF(s.payload->>'empresa',''),
    s.data_credito,
    NULLIF(s.payload->>'descricao_pagamento',''),
    NULLIF(s.payload->>'valor_lg','')::numeric,
    NULLIF(s.payload->>'competencia',''),
    NULLIF(s.payload->>'folha',''),
    NULLIF(s.payload->>'qtde_colaboradores','')::int,
    NULLIF(s.payload->>'observacao',''),
    NULLIF(s.payload->>'valor_bankmanager','')::numeric,
    NULLIF(s.payload->>'status_bankmanager',''),
    NULLIF(s.payload->>'valor_itau','')::numeric,
    NULLIF(s.payload->>'status_itau',''),
    NULLIF(s.payload->>'natureza_pagamento',''),
    COALESCE(s.solicitante_nome, 'Solicitação aprovada'),
    s.solicitante_id,
    now()
  ) RETURNING id INTO novo_id;

  PERFORM set_config('app.provisao_bypass', 'off', true);

  UPDATE public.pagamento_solicitacoes
    SET status = 'aprovada',
        decidido_em = now(),
        decidido_por = uid,
        decidido_por_nome = nome,
        motivo_decisao = _motivo,
        pagamento_id = novo_id
  WHERE id = _id;

  RETURN novo_id;
END;
$$;

-- Rejeitar solicitação
CREATE OR REPLACE FUNCTION public.rejeitar_solicitacao_provisao(_id UUID, _motivo TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  nome TEXT;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'administrador') THEN
    RAISE EXCEPTION 'Apenas administradores podem rejeitar solicitações.';
  END IF;

  SELECT COALESCE(p.nome, u.email) INTO nome
  FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = uid;

  UPDATE public.pagamento_solicitacoes
    SET status = 'rejeitada',
        decidido_em = now(),
        decidido_por = uid,
        decidido_por_nome = nome,
        motivo_decisao = _motivo
  WHERE id = _id AND status = 'pendente';
END;
$$;
