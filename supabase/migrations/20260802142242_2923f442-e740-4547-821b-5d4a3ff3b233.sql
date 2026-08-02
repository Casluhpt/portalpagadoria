-- ============================================================
-- 16. PROTEÇÃO, BACKUP E INTEGRIDADE
-- ============================================================

-- 1) Trilha central de auditoria de ações críticas
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  acao text NOT NULL,
  modulo text,
  tabela text,
  registro_id text,
  descricao text,
  justificativa text,
  snapshot jsonb,
  metadata jsonb,
  severidade text NOT NULL DEFAULT 'info',
  user_id uuid,
  user_nome text,
  user_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_acao_idx ON public.audit_log (acao);
CREATE INDEX IF NOT EXISTS audit_log_user_idx ON public.audit_log (user_id);

-- Somente leitura (admin) + inserção; nunca update/delete
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_admin_select" ON public.audit_log;
CREATE POLICY "audit_log_admin_select" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'));

DROP POLICY IF EXISTS "audit_log_insert_self" ON public.audit_log;
CREATE POLICY "audit_log_insert_self" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Logs são imutáveis: bloqueia UPDATE/DELETE inclusive para service_role
CREATE OR REPLACE FUNCTION public.audit_log_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'LOG_IMUTAVEL: registros de auditoria não podem ser alterados ou removidos.';
END;
$$;

DROP TRIGGER IF EXISTS audit_log_no_update ON public.audit_log;
CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();

DROP TRIGGER IF EXISTS audit_log_no_delete ON public.audit_log;
CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();

-- Trilhas antigas também ficam imutáveis
DROP TRIGGER IF EXISTS pagamentos_audit_no_update ON public.pagamentos_audit;
CREATE TRIGGER pagamentos_audit_no_update BEFORE UPDATE ON public.pagamentos_audit
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();

DROP TRIGGER IF EXISTS lancamentos_audit_no_update ON public.lancamentos_audit;
CREATE TRIGGER lancamentos_audit_no_update BEFORE UPDATE ON public.lancamentos_audit
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();

-- 2) Função de registro de ações críticas
CREATE OR REPLACE FUNCTION public.registrar_acao_critica(
  _acao text,
  _modulo text DEFAULT NULL,
  _tabela text DEFAULT NULL,
  _registro_id text DEFAULT NULL,
  _descricao text DEFAULT NULL,
  _justificativa text DEFAULT NULL,
  _snapshot jsonb DEFAULT NULL,
  _metadata jsonb DEFAULT NULL,
  _severidade text DEFAULT 'info'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  nome text;
  mail text;
  novo uuid;
BEGIN
  IF uid IS NOT NULL THEN
    SELECT COALESCE(p.nome, u.email), u.email INTO nome, mail
    FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
    WHERE u.id = uid;
  END IF;

  INSERT INTO public.audit_log (
    acao, modulo, tabela, registro_id, descricao, justificativa,
    snapshot, metadata, severidade, user_id, user_nome, user_email
  ) VALUES (
    _acao, _modulo, _tabela, _registro_id, _descricao, _justificativa,
    _snapshot, _metadata, COALESCE(_severidade, 'info'), uid, nome, mail
  ) RETURNING id INTO novo;

  RETURN novo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_acao_critica(text,text,text,text,text,text,jsonb,jsonb,text) TO authenticated, service_role;

-- 3) Exclusão lógica nas bases operacionais
ALTER TABLE public.pagamentos_diversos
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_by_nome text,
  ADD COLUMN IF NOT EXISTS motivo_exclusao text;

ALTER TABLE public.lancamentos
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_by_nome text,
  ADD COLUMN IF NOT EXISTS motivo_exclusao text;

ALTER TABLE public.despesas_fixas
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_by_nome text,
  ADD COLUMN IF NOT EXISTS motivo_exclusao text;

ALTER TABLE public.aprovacoes
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_by_nome text,
  ADD COLUMN IF NOT EXISTS motivo_exclusao text;

ALTER TABLE public.esocial_base
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_by_nome text,
  ADD COLUMN IF NOT EXISTS motivo_exclusao text;

CREATE INDEX IF NOT EXISTS pagamentos_diversos_deleted_idx ON public.pagamentos_diversos (deleted_at);
CREATE INDEX IF NOT EXISTS lancamentos_deleted_idx ON public.lancamentos (deleted_at);
CREATE INDEX IF NOT EXISTS despesas_fixas_deleted_idx ON public.despesas_fixas (deleted_at);
CREATE INDEX IF NOT EXISTS aprovacoes_deleted_idx ON public.aprovacoes (deleted_at);
CREATE INDEX IF NOT EXISTS esocial_base_deleted_idx ON public.esocial_base (deleted_at);

-- 4) Sem exclusão física: DELETE é convertido em exclusão lógica + log
CREATE OR REPLACE FUNCTION public.bloquear_exclusao_fisica()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  nome text;
  motivo text;
BEGIN
  -- Purga controlada (restauração/limpeza administrativa) usa bypass explícito
  IF current_setting('app.hard_delete_bypass', true) = 'on' THEN
    RETURN OLD;
  END IF;

  IF OLD.deleted_at IS NOT NULL THEN
    -- já excluído logicamente: nada a fazer, mantém preservado
    RETURN NULL;
  END IF;

  IF uid IS NOT NULL THEN
    SELECT COALESCE(p.nome, u.email) INTO nome
    FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
    WHERE u.id = uid;
  END IF;

  motivo := NULLIF(current_setting('app.motivo_exclusao', true), '');

  EXECUTE format(
    'UPDATE public.%I SET deleted_at = now(), deleted_by = $1, deleted_by_nome = $2, motivo_exclusao = $3 WHERE id = $4',
    TG_TABLE_NAME
  ) USING uid, nome, motivo, OLD.id;

  PERFORM public.registrar_acao_critica(
    'exclusao_logica', TG_TABLE_NAME, TG_TABLE_NAME, OLD.id::text,
    'Exclusão lógica de registro', motivo, to_jsonb(OLD), NULL, 'alerta'
  );

  RETURN NULL; -- cancela a exclusão física
END;
$$;

DROP TRIGGER IF EXISTS pagamentos_diversos_no_hard_delete ON public.pagamentos_diversos;
CREATE TRIGGER pagamentos_diversos_no_hard_delete BEFORE DELETE ON public.pagamentos_diversos
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_exclusao_fisica();

DROP TRIGGER IF EXISTS lancamentos_no_hard_delete ON public.lancamentos;
CREATE TRIGGER lancamentos_no_hard_delete BEFORE DELETE ON public.lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_exclusao_fisica();

DROP TRIGGER IF EXISTS despesas_fixas_no_hard_delete ON public.despesas_fixas;
CREATE TRIGGER despesas_fixas_no_hard_delete BEFORE DELETE ON public.despesas_fixas
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_exclusao_fisica();

DROP TRIGGER IF EXISTS aprovacoes_no_hard_delete ON public.aprovacoes;
CREATE TRIGGER aprovacoes_no_hard_delete BEFORE DELETE ON public.aprovacoes
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_exclusao_fisica();

DROP TRIGGER IF EXISTS esocial_base_no_hard_delete ON public.esocial_base;
CREATE TRIGGER esocial_base_no_hard_delete BEFORE DELETE ON public.esocial_base
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_exclusao_fisica();

-- 5) Campos automáticos de auditoria não podem ser alterados manualmente
CREATE OR REPLACE FUNCTION public.proteger_campos_auditoria()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF to_jsonb(OLD) ? 'created_at' THEN
    NEW.created_at := OLD.created_at;
  END IF;
  IF to_jsonb(OLD) ? 'created_by' THEN
    NEW.created_by := OLD.created_by;
  END IF;
  IF to_jsonb(OLD) ? 'created_by_nome' THEN
    NEW.created_by_nome := OLD.created_by_nome;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS despesas_fixas_protege_auditoria ON public.despesas_fixas;
CREATE TRIGGER despesas_fixas_protege_auditoria BEFORE UPDATE ON public.despesas_fixas
  FOR EACH ROW EXECUTE FUNCTION public.proteger_campos_auditoria();

CREATE OR REPLACE FUNCTION public.proteger_registro_pagamento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.registrado_em := OLD.registrado_em;
  NEW.registrado_por := OLD.registrado_por;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pagamentos_diversos_protege_auditoria ON public.pagamentos_diversos;
CREATE TRIGGER pagamentos_diversos_protege_auditoria BEFORE UPDATE ON public.pagamentos_diversos
  FOR EACH ROW EXECUTE FUNCTION public.proteger_campos_auditoria();

-- 6) Competências arquivadas são somente leitura
CREATE OR REPLACE FUNCTION public.competencia_arquivada_readonly()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'COMPETENCIA_ARQUIVADA: snapshots de competência são somente leitura.';
END;
$$;

DROP TRIGGER IF EXISTS provisao_comp_readonly_upd ON public.provisao_fechamento_competencia;
CREATE TRIGGER provisao_comp_readonly_upd BEFORE UPDATE ON public.provisao_fechamento_competencia
  FOR EACH ROW EXECUTE FUNCTION public.competencia_arquivada_readonly();

DROP TRIGGER IF EXISTS provisao_comp_readonly_del ON public.provisao_fechamento_competencia;
CREATE TRIGGER provisao_comp_readonly_del BEFORE DELETE ON public.provisao_fechamento_competencia
  FOR EACH ROW EXECUTE FUNCTION public.competencia_arquivada_readonly();

DROP TRIGGER IF EXISTS fechamento_pag_readonly_upd ON public.fechamento_pagamentos;
CREATE TRIGGER fechamento_pag_readonly_upd BEFORE UPDATE ON public.fechamento_pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.competencia_arquivada_readonly();

DROP TRIGGER IF EXISTS fechamento_pag_readonly_del ON public.fechamento_pagamentos;
CREATE TRIGGER fechamento_pag_readonly_del BEFORE DELETE ON public.fechamento_pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.competencia_arquivada_readonly();

DROP TRIGGER IF EXISTS fechamento_apr_readonly_upd ON public.fechamento_aprovacoes;
CREATE TRIGGER fechamento_apr_readonly_upd BEFORE UPDATE ON public.fechamento_aprovacoes
  FOR EACH ROW EXECUTE FUNCTION public.competencia_arquivada_readonly();

DROP TRIGGER IF EXISTS fechamento_apr_readonly_del ON public.fechamento_aprovacoes;
CREATE TRIGGER fechamento_apr_readonly_del BEFORE DELETE ON public.fechamento_aprovacoes
  FOR EACH ROW EXECUTE FUNCTION public.competencia_arquivada_readonly();

-- 7) Restauração exclusiva do Administrador (com justificativa)
CREATE OR REPLACE FUNCTION public.restaurar_registro(
  _tabela text,
  _id uuid,
  _justificativa text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'administrador') THEN
    RAISE EXCEPTION 'Apenas administradores podem restaurar registros.';
  END IF;

  IF _justificativa IS NULL OR length(btrim(_justificativa)) < 5 THEN
    RAISE EXCEPTION 'Justificativa obrigatória para restauração de registro.';
  END IF;

  IF _tabela NOT IN ('pagamentos_diversos','lancamentos','despesas_fixas','aprovacoes','esocial_base') THEN
    RAISE EXCEPTION 'Tabela não permitida para restauração: %', _tabela;
  END IF;

  EXECUTE format(
    'UPDATE public.%I SET deleted_at = NULL, deleted_by = NULL, deleted_by_nome = NULL, motivo_exclusao = NULL WHERE id = $1',
    _tabela
  ) USING _id;

  PERFORM public.registrar_acao_critica(
    'restauracao_registro', _tabela, _tabela, _id::text,
    'Restauração de registro excluído logicamente', _justificativa, NULL, NULL, 'alerta'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.restaurar_registro(text,uuid,text) TO authenticated, service_role;
