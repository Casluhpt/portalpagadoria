CREATE TYPE public.app_version_tipo AS ENUM ('major','minor','patch','hotfix');

CREATE TABLE public.app_versions (
  versao TEXT PRIMARY KEY,
  lancada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  tipo public.app_version_tipo NOT NULL DEFAULT 'minor',
  titulo TEXT NOT NULL,
  resumo TEXT,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  autor TEXT,
  destaque BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_versions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_versions TO authenticated;
GRANT ALL ON public.app_versions TO service_role;

ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ler versões"
  ON public.app_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem inserir versões"
  ON public.app_versions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins podem atualizar versões"
  ON public.app_versions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins podem remover versões"
  ON public.app_versions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'));

CREATE TRIGGER trg_app_versions_touch
  BEFORE UPDATE ON public.app_versions
  FOR EACH ROW EXECUTE FUNCTION public.password_metadata_touch();

INSERT INTO public.app_versions (versao, lancada_em, tipo, titulo, resumo, itens, autor, destaque) VALUES
('1.0.0', '2026-06-01 09:00:00+00', 'major', 'Base do portal',
 'Primeira versão do portal com autenticação, estrutura de navegação e rotas principais.',
 '[
   {"categoria":"novo","descricao":"Autenticação com email/senha e Google"},
   {"categoria":"novo","descricao":"Estrutura de sidebar e rotas do portal"},
   {"categoria":"novo","descricao":"Perfis de acesso (administrador, viewer, auditor, etc.)"}
 ]'::jsonb, 'Equipe Pagadoria', false),

('1.1.0', '2026-06-15 09:00:00+00', 'minor', 'Pagamentos Diversos + Provisão Diária',
 'Módulos de Pagamentos Diversos e Provisão Diária com sincronização automática entre as bases.',
 '[
   {"categoria":"novo","descricao":"Lançamentos de Pagamentos Diversos"},
   {"categoria":"novo","descricao":"Base de Provisão Diária (data de crédito, empresa, banco, valor)"},
   {"categoria":"novo","descricao":"Sincronização automática Pagamentos → Provisão"}
 ]'::jsonb, 'Equipe Pagadoria', false),

('1.2.0', '2026-06-25 09:00:00+00', 'minor', 'Administração de Usuários',
 'Painel completo de administração de usuários com presença em tempo real, convites e reset de senha.',
 '[
   {"categoria":"novo","descricao":"Painel de administração de usuários"},
   {"categoria":"novo","descricao":"Status de presença (online/ausente/offline) em tempo real"},
   {"categoria":"novo","descricao":"Convite de novos usuários por email com definição de perfil"},
   {"categoria":"novo","descricao":"Reset de senha por email pelo admin"},
   {"categoria":"novo","descricao":"Alteração de perfil entre Administrador e Viewer"}
 ]'::jsonb, 'Equipe Pagadoria', false),

('1.3.0', '2026-07-01 09:00:00+00', 'minor', 'Sino de notificações com histórico',
 'Central de notificações do portal com abas de Não lidas e Histórico e botão de fechar item a item.',
 '[
   {"categoria":"novo","descricao":"Sino de notificações no topo com contador"},
   {"categoria":"novo","descricao":"Abas Não lidas / Histórico"},
   {"categoria":"melhoria","descricao":"Botão (X) para fechar notificação individual"},
   {"categoria":"melhoria","descricao":"Toasts com botão de fechar (global via sonner)"}
 ]'::jsonb, 'Equipe Pagadoria', false),

('1.4.0', '2026-07-05 09:00:00+00', 'minor', 'Segurança de senha (expiração em 60 dias)',
 'Política de expiração de senha a cada 60 dias com avisos progressivos e bloqueio ao expirar.',
 '[
   {"categoria":"seguranca","descricao":"Expiração de senha a cada 60 dias"},
   {"categoria":"seguranca","descricao":"Banner e toasts de aviso em 7/5/3/2/1 dias antes da expiração"},
   {"categoria":"seguranca","descricao":"Bloqueio da tela ao expirar com troca de senha obrigatória"}
 ]'::jsonb, 'Equipe Pagadoria', false),

('1.5.0', '2026-07-10 09:00:00+00', 'minor', 'Reorganização do menu de Configurações',
 'Menu de Configurações movido para o topo, ao lado do nome do usuário, com opções por perfil.',
 '[
   {"categoria":"melhoria","descricao":"Botão Configurações ao lado do nome do usuário"},
   {"categoria":"melhoria","descricao":"Viewer: apenas Redefinir senha e Sair"},
   {"categoria":"melhoria","descricao":"Administrador: Administração de usuários, Histórico de versões e Configurações avançadas"},
   {"categoria":"melhoria","descricao":"Itens removidos da barra lateral (Configurações, Usuários, Histórico)"}
 ]'::jsonb, 'Equipe Pagadoria', true);