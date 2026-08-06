INSERT INTO public.app_versions (versao, lancada_em, tipo, titulo, resumo, itens, destaque)
VALUES (
  '2.7.6',
  NOW(),
  'patch',
  'Padronização Visual e Consistência de Ícones',
  'Melhoria na harmonia estética do portal através da padronização de tamanhos de ícones em toda a interface.',
  '[
    {"categoria": "correcao", "descricao": "Padronização dos ícones de KPIs e Módulos no Dashboard (h-5 e h-6)."},
    {"categoria": "correcao", "descricao": "Uniformização dos ícones do menu lateral e abas de configurações (h-4)."},
    {"categoria": "correcao", "descricao": "Refinamento dos ícones de status e categorias no Histórico de Versões."},
    {"categoria": "correcao", "descricao": "Ajuste de pesos visuais para manter o padrão Minimalismo Translúcido."}
  ]'::jsonb,
  true
);