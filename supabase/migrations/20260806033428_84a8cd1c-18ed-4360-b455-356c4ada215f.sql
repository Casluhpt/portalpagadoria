-- Atualização do Histórico de Versões para v2.7.4
INSERT INTO public.app_versions (versao, titulo, resumo, autor, lancada_em, destaque, itens, tipo)
VALUES ('2.7.4', 'Localização: Formato de Data Brasileiro', 'Padronização visual das datas para o formato DD/MM/AAAA em todo o sistema.', 'Lucas Chaves', now(), true, 
'[
  {"categoria": "melhoria", "descricao": "Interface: Datas agora são exibidas no formato brasileiro (DD/MM/AAAA) para melhor legibilidade."},
  {"categoria": "melhoria", "descricao": "Base da Provisão: Células de data atualizadas para exibição localizada."},
  {"categoria": "melhoria", "descricao": "Pagamentos Diversos: Ranking e tabelas de consulta padronizados com o novo formato de data."}
]', 'patch')
ON CONFLICT (versao) DO UPDATE 
SET titulo = EXCLUDED.titulo,
    resumo = EXCLUDED.resumo,
    itens = EXCLUDED.itens,
    lancada_em = EXCLUDED.lancada_em,
    destaque = EXCLUDED.destaque;
