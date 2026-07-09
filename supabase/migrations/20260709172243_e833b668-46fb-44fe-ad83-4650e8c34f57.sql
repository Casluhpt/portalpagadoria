-- Restore core tables dropped by earlier pivot + add comunicados system

-- Enum for roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('administrador','criador_competencia','operacional','consulta','auditor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  nome text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read own profile" ON public.profiles;
CREATE POLICY "read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "update own profile" ON public.profiles;
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- User roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read own roles" ON public.user_roles;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- handle_new_user trigger fn
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Lancamentos
CREATE TABLE IF NOT EXISTS public.lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_pedido integer,
  issuer text,
  supplier text,
  invoice_number text,
  account_group text,
  center text,
  company integer,
  due_date date,
  gross_amount numeric,
  register_date date,
  desc_status text,
  log text,
  text_field text,
  action text,
  empresa text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos TO authenticated;
GRANT ALL ON public.lancamentos TO service_role;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated read lancamentos" ON public.lancamentos;
CREATE POLICY "authenticated read lancamentos" ON public.lancamentos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin write lancamentos" ON public.lancamentos;
CREATE POLICY "admin write lancamentos" ON public.lancamentos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

-- Provisao diaria
CREATE TABLE IF NOT EXISTS public.provisao_diaria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date,
  empresa text,
  banco text,
  valor numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provisao_diaria TO authenticated;
GRANT ALL ON public.provisao_diaria TO service_role;
ALTER TABLE public.provisao_diaria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated read provisao" ON public.provisao_diaria;
CREATE POLICY "authenticated read provisao" ON public.provisao_diaria FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin write provisao" ON public.provisao_diaria;
CREATE POLICY "admin write provisao" ON public.provisao_diaria FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

-- Comunicados (global broadcast messages)
CREATE TABLE IF NOT EXISTS public.comunicados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  mensagem text NOT NULL,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.comunicados TO authenticated;
GRANT INSERT, DELETE ON public.comunicados TO authenticated;
GRANT ALL ON public.comunicados TO service_role;
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated read comunicados" ON public.comunicados;
CREATE POLICY "authenticated read comunicados" ON public.comunicados FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin insert comunicados" ON public.comunicados;
CREATE POLICY "admin insert comunicados" ON public.comunicados FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrador') AND criado_por = auth.uid());
DROP POLICY IF EXISTS "admin delete comunicados" ON public.comunicados;
CREATE POLICY "admin delete comunicados" ON public.comunicados FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'));

-- Per-user read tracking
CREATE TABLE IF NOT EXISTS public.comunicado_leituras (
  comunicado_id uuid NOT NULL REFERENCES public.comunicados(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lido_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comunicado_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.comunicado_leituras TO authenticated;
GRANT ALL ON public.comunicado_leituras TO service_role;
ALTER TABLE public.comunicado_leituras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read own leituras" ON public.comunicado_leituras;
CREATE POLICY "read own leituras" ON public.comunicado_leituras FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "insert own leituras" ON public.comunicado_leituras;
CREATE POLICY "insert own leituras" ON public.comunicado_leituras FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "delete own leituras" ON public.comunicado_leituras;
CREATE POLICY "delete own leituras" ON public.comunicado_leituras FOR DELETE TO authenticated USING (user_id = auth.uid());