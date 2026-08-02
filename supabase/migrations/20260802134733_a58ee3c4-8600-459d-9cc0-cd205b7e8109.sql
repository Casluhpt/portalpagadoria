CREATE TABLE public.material_apoio (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  categoria text NOT NULL DEFAULT 'Geral',
  resumo text,
  conteudo text NOT NULL,
  palavras_chave text[] NOT NULL DEFAULT '{}',
  ordem integer NOT NULL DEFAULT 0,
  publicado boolean NOT NULL DEFAULT true,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_por_nome text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_apoio TO authenticated;
GRANT ALL ON public.material_apoio TO service_role;

ALTER TABLE public.material_apoio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem materiais publicados"
  ON public.material_apoio FOR SELECT TO authenticated
  USING (publicado = true OR public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Administradores criam materiais"
  ON public.material_apoio FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Administradores editam materiais"
  ON public.material_apoio FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Administradores removem materiais"
  ON public.material_apoio FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'));

CREATE TRIGGER material_apoio_touch
  BEFORE UPDATE ON public.material_apoio
  FOR EACH ROW EXECUTE FUNCTION public.pagamentos_diversos_touch();

CREATE INDEX idx_material_apoio_categoria ON public.material_apoio (categoria);

INSERT INTO public.material_apoio (titulo, categoria, resumo, conteudo, palavras_chave, ordem) VALUES
('Visão geral do Portal da Pagadoria', 'Introdução', 'O que é o portal, quais módulos existem e como navegar.', E'# Visão geral do Portal da Pagadoria\n\nO Portal da Pagadoria centraliza os processos de pagamento, provisão, conciliação e governança.\n\n## Módulos principais\n- **Resultados Principais**: indicadores consolidados dos lançamentos.\n- **Provisão Diária**: base diária de provisão, integração automática dos pagamentos e fechamento de competência.\n- **Pagamentos Diversos**: registro, importação e exportação da base de pagamentos.\n- **Conciliação Bancária**: cruzamento entre a base do portal e o extrato bancário.\n- **Despesas Fixas**: PJ, penhora/pensão e fornecedores de janeiro a dezembro.\n- **Processo de Aprovação**: evidências de agendamento bancário por empresa.\n- **Auditoria / Registros Excluídos**: rastreabilidade de tudo que foi alterado ou apagado.\n\n## Navegação\nUse a barra lateral esquerda para os módulos, a busca total no topo da tela inicial para encontrar qualquer registro e o botão de voltar no canto superior esquerdo.', ARRAY['portal','visão geral','módulos','navegação'], 1),
('Como registrar um pagamento diverso', 'Pagamentos', 'Passo a passo do lançamento manual e da importação em massa.', E'# Como registrar um pagamento diverso\n\n1. Acesse **Pagamentos Diversos** na barra lateral.\n2. Clique em **Novo registro** e preencha célula, arquivo de remessa, banco, empresa e data de crédito.\n3. Informe o **valor LG**, competência, folha e quantidade de colaboradores.\n4. Salve. O registro é auditado automaticamente com autor e data/hora.\n\n## Importação em massa\n- O arquivo Excel precisa conter exatamente as colunas do modelo.\n- O portal valida as colunas antes de importar e aponta linhas com erro.\n- Duplicidades são detectadas e exigem confirmação.\n\n## Observações\n- Datas com competência fechada são bloqueadas.\n- Perfis Visualizador e Visitante têm acesso somente leitura.', ARRAY['pagamento','importação','excel','valor lg','remessa'], 2),
('Provisão diária e fechamento de competência', 'Provisão', 'Como a provisão é preenchida automaticamente e como fechar o mês.', E'# Provisão diária e fechamento de competência\n\n## Preenchimento automático\nAo clicar em **Notificar Envio**, o portal sincroniza os pagamentos do dia (campo valor LG) para a base de provisão, evitando digitação manual e duplicidade.\n\n## Separação por mês\nA base de provisão é separada pelo campo de mês (formato AAAA-MM) e as datas são exibidas no padrão DD/MM/AAAA.\n\n## Fechamento de competência\n1. Confira os totais do mês.\n2. Clique em **Fechamento de Competência** e confirme no aviso.\n3. O portal grava um snapshot do mês e limpa a base corrente.\n4. Apenas administradores podem fechar ou reabrir.', ARRAY['provisão','fechamento','competência','snapshot','notificar envio'], 3),
('Perfis de acesso e permissões', 'Governança', 'O que cada perfil pode ver, editar ou apenas consultar.', E'# Perfis de acesso e permissões\n\n| Perfil | Visualiza | Edita |\n|---|---|---|\n| Administração | Todos os módulos | Sim, incluindo fechamentos e usuários |\n| Criador de Competência | Provisão e pagamentos | Cria e fecha competências |\n| Operacional | Módulos operacionais | Lançamentos do dia a dia |\n| Auditor | Auditoria e registros excluídos | Não |\n| Visualizador | Pagamentos e divergências | Não |\n| Gerência/Visitante | Consulta limitada | Não |\n\nO setor do usuário (Folha/Férias, Rescisão, Benefícios, Pagadoria, Gerência/Visitante) é obrigatório na criação da conta e pode ser alterado pelo administrador em **Administração de usuários**.', ARRAY['perfil','permissão','acesso','setor','administração'], 4),
('Conciliação bancária', 'Conciliação', 'Níveis de correspondência e status da conciliação.', E'# Conciliação bancária\n\nA conciliação compara a base do portal com o arquivo do banco em cinco níveis:\n\n1. **Nível 1** – Correspondência exata (valor, data e empresa).\n2. **Nível 2** – Mesmo valor com pequena diferença de data.\n3. **Nível 3** – Agrupamento de lançamentos que somam o valor do banco.\n4. **Nível 4** – Correspondência parcial que exige análise manual.\n5. **Nível 5** – Divergência, sem correspondência.\n\nCada execução guarda histórico com arquivo importado, resultado e responsável.', ARRAY['conciliação','banco','extrato','divergência','níveis'], 5),
('Suporte técnico e canal de atendimento', 'Suporte', 'Como abrir um chamado com anexo e acompanhar o retorno.', E'# Suporte técnico\n\n1. Acesse **Configurações > Canal de Suporte Técnico**.\n2. Escolha a categoria: Erro, Bug ou Melhoria.\n3. Descreva o ocorrido com o máximo de detalhes (módulo, ação, horário).\n4. Anexe uma evidência (imagem ou documento de até 5 MB).\n5. Envie. O chamado fica registrado com seu nome, e-mail e data/hora.\n\nDicas para agilizar: informe a empresa, a competência e o número do registro envolvido.', ARRAY['suporte','chamado','erro','bug','melhoria','anexo'], 6);