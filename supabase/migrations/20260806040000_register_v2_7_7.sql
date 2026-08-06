INSERT INTO public.app_versions (versao, lancada_em, titulo, resumo, itens, destaque)
VALUES (
  'v2.7.7',
  NOW(),
  'Evolução da IA Assistente e Contextualização',
  'IA Assistente agora totalmente integrada ao contexto operacional do usuário, respeitando permissões RBAC e mantendo memória de conversas.',
  '["Integração com contexto de navegação (Path)", "Respeito rigoroso às permissões (RBAC)", "Memória de conversa e aprendizado", "Suporte contextual por módulo"]'::jsonb,
  true
) ON CONFLICT (versao) DO UPDATE SET 
  lancada_em = EXCLUDED.lancada_em,
  titulo = EXCLUDED.titulo,
  resumo = EXCLUDED.resumo,
  itens = EXCLUDED.itens,
  destaque = EXCLUDED.destaque;
