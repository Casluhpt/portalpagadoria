
-- Cleanup
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.lancamentos CASCADE;
DROP TABLE IF EXISTS public.provisao_diaria CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Enums
CREATE TYPE public.solicitacao_tipo AS ENUM (
  'pagamento_diverso','provisao','holerite','ferias','rescisao','outro'
);
CREATE TYPE public.solicitacao_status AS ENUM (
  'aberta','em_analise','respondida','concluida','cancelada'
);

-- shared trigger fn (recreate)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END; $$;

-- Solicitações
CREATE TABLE public.solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  solicitante_nome  text NOT NULL,
  solicitante_email text NOT NULL,
  tipo   public.solicitacao_tipo NOT NULL,
  assunto text NOT NULL,
  descricao text NOT NULL,
  status public.solicitacao_status NOT NULL DEFAULT 'aberta',
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX solicitacoes_email_idx ON public.solicitacoes (lower(solicitante_email));
CREATE INDEX solicitacoes_status_idx ON public.solicitacoes (status);

GRANT SELECT, INSERT ON public.solicitacoes TO anon, authenticated;
GRANT ALL ON public.solicitacoes TO service_role;
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read solicitacoes"
  ON public.solicitacoes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert solicitacoes"
  ON public.solicitacoes FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TRIGGER solicitacoes_set_updated_at
BEFORE UPDATE ON public.solicitacoes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Código sequencial por ano: PAG-YYYY-NNNNNN
CREATE SEQUENCE public.solicitacoes_codigo_seq;

CREATE OR REPLACE FUNCTION public.solicitacoes_assign_codigo()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := 'PAG-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.solicitacoes_codigo_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER solicitacoes_codigo_before_insert
BEFORE INSERT ON public.solicitacoes
FOR EACH ROW EXECUTE FUNCTION public.solicitacoes_assign_codigo();

-- Updates / histórico
CREATE TABLE public.solicitacao_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id uuid NOT NULL REFERENCES public.solicitacoes(id) ON DELETE CASCADE,
  autor_tipo text NOT NULL CHECK (autor_tipo IN ('solicitante','pagadoria_adp')),
  autor_nome text NOT NULL,
  autor_email text,
  mensagem text NOT NULL,
  novo_status public.solicitacao_status,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX solicitacao_updates_sol_idx ON public.solicitacao_updates (solicitacao_id);

GRANT SELECT, INSERT ON public.solicitacao_updates TO anon, authenticated;
GRANT ALL ON public.solicitacao_updates TO service_role;
ALTER TABLE public.solicitacao_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read updates"
  ON public.solicitacao_updates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "solicitante insert updates"
  ON public.solicitacao_updates FOR INSERT TO anon, authenticated
  WITH CHECK (autor_tipo = 'solicitante');
