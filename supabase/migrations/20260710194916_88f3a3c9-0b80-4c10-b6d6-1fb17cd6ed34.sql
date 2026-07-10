
CREATE TABLE IF NOT EXISTS public.lancamentos_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lancamento_id UUID,
  acao TEXT NOT NULL,
  user_id UUID,
  user_nome TEXT,
  snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lancamentos_audit_created_idx ON public.lancamentos_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS lancamentos_audit_lanc_idx ON public.lancamentos_audit(lancamento_id);

GRANT SELECT, INSERT ON public.lancamentos_audit TO authenticated;
GRANT ALL ON public.lancamentos_audit TO service_role;

ALTER TABLE public.lancamentos_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e auditores leem auditoria de lançamentos"
  ON public.lancamentos_audit FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'::app_role) OR public.has_role(auth.uid(), 'auditor'::app_role));

CREATE POLICY "auth insert audit lancamentos"
  ON public.lancamentos_audit FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.lancamentos_audit_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE nome TEXT;
BEGIN
  SELECT COALESCE(p.nome, u.email) INTO nome
  FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = auth.uid();

  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.lancamentos_audit(lancamento_id, acao, user_id, user_nome, snapshot)
    VALUES (OLD.id, 'DELETE', auth.uid(), nome, to_jsonb(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.lancamentos_audit(lancamento_id, acao, user_id, user_nome, snapshot)
    VALUES (NEW.id, 'UPDATE', auth.uid(), nome, to_jsonb(NEW));
    RETURN NEW;
  ELSE
    INSERT INTO public.lancamentos_audit(lancamento_id, acao, user_id, user_nome, snapshot)
    VALUES (NEW.id, 'INSERT', auth.uid(), nome, to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS lancamentos_audit_trg ON public.lancamentos;
CREATE TRIGGER lancamentos_audit_trg
AFTER INSERT OR UPDATE OR DELETE ON public.lancamentos
FOR EACH ROW EXECUTE FUNCTION public.lancamentos_audit_fn();
