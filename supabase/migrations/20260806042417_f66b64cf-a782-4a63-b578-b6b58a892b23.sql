-- Register version update v2.8.2
INSERT INTO public.app_versions (versao, lancada_em, titulo, resumo, itens, destaque)
VALUES (
  'v2.8.2',
  NOW(),
  'Indicador de Status da IA',
  'Implementação de indicadores visuais de status (Online/Offline) no cabeçalho e na interface de chat da IA, com atualização em tempo real via Supabase Realtime.',
  '["Novo indicador de status no Header (cabeçalho)", "Sincronização em tempo real do status da IA entre todos os usuários", "Feedback visual diferenciado no botão flutuante quando a IA está offline", "Respeito integral ao RBAC para visualização do status"]'::jsonb,
  true
) ON CONFLICT (versao) DO UPDATE SET 
  lancada_em = EXCLUDED.lancada_em,
  titulo = EXCLUDED.titulo,
  resumo = EXCLUDED.resumo,
  itens = EXCLUDED.itens,
  destaque = EXCLUDED.destaque;