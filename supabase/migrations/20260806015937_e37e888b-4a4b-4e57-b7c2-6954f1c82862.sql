
-- 1. Extend app_role if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('administrador', 'auditor', 'operacional', 'criador_competencia', 'consulta', 'viewer', 'visitante', 'gerente');
    ELSE
        ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gerente';
    END IF;
END
$$;

-- 2. Modules Table
CREATE TABLE IF NOT EXISTS public.app_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT ON public.app_modules TO authenticated;
GRANT ALL ON public.app_modules TO service_role;

ALTER TABLE public.app_modules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage modules' AND tablename = 'app_modules') THEN
        CREATE POLICY "Admins can manage modules" ON public.app_modules
            FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'administrador'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'All users can view modules' AND tablename = 'app_modules') THEN
        CREATE POLICY "All users can view modules" ON public.app_modules
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- 3. User Modules (Junction)
CREATE TABLE IF NOT EXISTS public.user_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module_id UUID REFERENCES public.app_modules(id) ON DELETE CASCADE NOT NULL,
    is_authorized BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, module_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_modules TO authenticated;
GRANT ALL ON public.user_modules TO service_role;

ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage user modules' AND tablename = 'user_modules') THEN
        CREATE POLICY "Admins can manage user modules" ON public.user_modules
            FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'administrador'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own modules' AND tablename = 'user_modules') THEN
        CREATE POLICY "Users can view their own modules" ON public.user_modules
            FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4. User-specific permissions
CREATE TABLE IF NOT EXISTS public.user_specific_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    is_allowed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, resource, action)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_specific_permissions TO authenticated;
GRANT ALL ON public.user_specific_permissions TO service_role;

ALTER TABLE public.user_specific_permissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage user specific permissions' AND tablename = 'user_specific_permissions') THEN
        CREATE POLICY "Admins can manage user specific permissions" ON public.user_specific_permissions
            FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'administrador'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own specific permissions' AND tablename = 'user_specific_permissions') THEN
        CREATE POLICY "Users can view their own specific permissions" ON public.user_specific_permissions
            FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Helper function for check permission
CREATE OR REPLACE FUNCTION public.check_user_permission(_user_id UUID, _resource TEXT, _action TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _is_allowed BOOLEAN;
BEGIN
    SELECT is_allowed INTO _is_allowed
    FROM public.user_specific_permissions
    WHERE user_id = _user_id AND resource = _resource AND action = _action;
    
    IF FOUND THEN
        RETURN _is_allowed;
    END IF;

    SELECT EXISTS (
        SELECT 1 
        FROM public.app_permissions ap
        JOIN public.user_roles ur ON ur.role = ap.role
        WHERE ur.user_id = _user_id 
          AND ap.resource = _resource 
          AND ap.action = _action
          AND ap.is_allowed = true
    ) INTO _is_allowed;

    RETURN _is_allowed;
END;
$$;

-- 6. Seed Initial Modules
INSERT INTO public.app_modules (key, label, description)
VALUES 
    ('resultados', 'Resultados Principais', 'Apresentação dos indicadores consolidados da Pagadoria.'),
    ('pagamentos', 'Pagamentos Diversos', 'Gestão dos pagamentos diversos processados pela Pagadoria.'),
    ('provisao', 'Provisão Diária', 'Controle diário das provisões e evolução financeira.'),
    ('conciliacao', 'Conciliação Bancária', 'Validação dos pagamentos contra retornos bancários.'),
    ('aprovacao', 'Processo de Aprovação', 'Fluxo de aprovações dos processos da Pagadoria.'),
    ('esocial', 'Controle E-Social', 'Acompanhamento dos eventos e envios ao E-Social.'),
    ('despesas-fixas', 'Despesas Fixas', 'Lançamentos mensais de PJs, Pensão, Penhora e Fornecedores.'),
    ('auditoria', 'Auditoria e Logs', 'Histórico de ações críticas e segurança.')
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description;

-- 7. Audit Log triggers
CREATE OR REPLACE FUNCTION public.log_permission_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_log (
        acao, 
        modulo, 
        tabela, 
        registro_id, 
        descricao, 
        severidade,
        user_id,
        metadata
    ) VALUES (
        CASE WHEN TG_OP = 'INSERT' THEN 'permissao_criada' WHEN TG_OP = 'UPDATE' THEN 'permissao_alterada' ELSE 'permissao_removida' END,
        'Segurança',
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id)::TEXT,
        'Alteração de permissões/módulos para usuário: ' || COALESCE(NEW.user_id, OLD.user_id)::TEXT,
        'alerta',
        auth.uid(),
        jsonb_build_object('op', TG_OP, 'old', to_jsonb(OLD), 'new', to_jsonb(NEW))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_user_modules') THEN
        CREATE TRIGGER trg_audit_user_modules
        AFTER INSERT OR UPDATE OR DELETE ON public.user_modules
        FOR EACH ROW EXECUTE FUNCTION public.log_permission_change();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_user_specific_permissions') THEN
        CREATE TRIGGER trg_audit_user_specific_permissions
        AFTER INSERT OR UPDATE OR DELETE ON public.user_specific_permissions
        FOR EACH ROW EXECUTE FUNCTION public.log_permission_change();
    END IF;
END $$;

-- 8. Enhance profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all profiles' AND tablename = 'profiles') THEN
        CREATE POLICY "Admins can view all profiles" ON public.profiles
            FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'administrador'));
    END IF;
END $$;

GRANT UPDATE(status, setor, created_by) ON public.profiles TO authenticated;
