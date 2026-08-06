-- Criação da versão v2.7.2 para sincronização automática
INSERT INTO public.app_versions (versao, titulo, resumo, autor, lancada_em, destaque, itens, tipo)
VALUES ('2.7.2', 'Sincronização de Histórico e Prompt', 'Implementação da automação entre as instruções do portal e o histórico de versões.', 'Lucas Chaves', now(), true, 
'[
  {"categoria": "melhoria", "descricao": "Automação de Versões: Histórico sincronizado automaticamente com as evoluções do prompt do sistema."},
  {"categoria": "melhoria", "descricao": "Sincronização de Contexto: Atualização do footer invisível de instruções para refletir o estado atual do desenvolvimento."},
  {"categoria": "melhoria", "descricao": "Consistência de Dados: Garantia de que todas as correções de prompt sejam refletidas no changelog público do administrador."}
]', 'minor')
ON CONFLICT (versao) DO UPDATE 
SET titulo = EXCLUDED.titulo,
    resumo = EXCLUDED.resumo,
    itens = EXCLUDED.itens,
    lancada_em = EXCLUDED.lancada_em,
    destaque = EXCLUDED.destaque;
