-- Atualização do Histórico de Versões para v2.7.1
INSERT INTO public.app_versions (versao, titulo, resumo, autor, lancada_em, destaque, itens, tipo)
VALUES ('2.7.1', 'Usabilidade, Inteligência e Segurança', 'Refinamento de UX, IA humanizada, segurança RBAC e trilha de auditoria para lançamentos.', 'Lucas Chaves', now(), true, 
'[
  {"categoria": "melhoria", "descricao": "IA da Pagadoria: Humanização, memória de conversa e direcionamento inteligente para módulos."},
  {"categoria": "novo", "descricao": "Trilha de Auditoria (Audit Trail): Histórico completo de alterações em lançamentos com diff detalhado."},
  {"categoria": "seguranca", "descricao": "Segurança RBAC: Controle granular de acesso e gerenciador de permissões por usuário (Gerente/Admin)."},
  {"categoria": "correcao", "descricao": "Exclusão Lógica: Registros deletados são movidos para auditoria, preservando a integridade dos dados."},
  {"categoria": "melhoria", "descricao": "Minimalismo Translúcido: Nova interface Floating AI e melhorias visuais em popups e botões."},
  {"categoria": "correcao", "descricao": "Permissões de Edição: Usuários agora podem corrigir seus próprios lançamentos independentemente da fila."}
]', 'minor')
ON CONFLICT (versao) DO UPDATE 
SET titulo = EXCLUDED.titulo,
    resumo = EXCLUDED.resumo,
    itens = EXCLUDED.itens,
    lancada_em = EXCLUDED.lancada_em,
    destaque = EXCLUDED.destaque;

-- Inserindo versões intermediárias ausentes para manter a cronologia
INSERT INTO public.app_versions (versao, titulo, resumo, autor, lancada_em, destaque, itens, tipo)
VALUES ('2.6.0', 'Identidade e Branding', 'Centralização da gestão visual e otimização de branding por área.', 'Lucas Chaves', now() - interval '1 day', false, 
'[
  {"categoria": "novo", "descricao": "Painel de Identidade Visual: Upload e gestão de logos dinâmicos no portal."},
  {"categoria": "melhoria", "descricao": "Otimização de Performance: Melhorias nas queries de Provisão Diária e Pagamentos."},
  {"categoria": "melhoria", "descricao": "Branding: Atualização da marca Profarma 65 anos em todo o ecossistema."}
]', 'minor')
ON CONFLICT (versao) DO NOTHING;

INSERT INTO public.app_versions (versao, titulo, resumo, autor, lancada_em, destaque, itens, tipo)
VALUES ('2.5.0', 'Planilha Inteligente e Governança', 'IA aplicada ao fluxo de dados e reforço das regras de negócio.', 'Lucas Chaves', now() - interval '2 days', false, 
'[
  {"categoria": "novo", "descricao": "Planilha Inteligente: Aprendizado de padrões e sugestões de preenchimento automático."},
  {"categoria": "seguranca", "descricao": "Governança de Fechamento: Bloqueio de edição para competências encerradas."},
  {"categoria": "melhoria", "descricao": "Gestão de Fila: Notificações inteligentes e saída voluntária com confirmação."}
]', 'minor')
ON CONFLICT (versao) DO NOTHING;