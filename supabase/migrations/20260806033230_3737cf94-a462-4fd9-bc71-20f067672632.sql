-- Correção para evitar erro de 'null value in column "mes"'
-- Embora o código JS já trate, vamos garantir um valor padrão no banco para maior segurança
ALTER TABLE public.provisao_diaria 
ALTER COLUMN mes SET DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM');

-- Atualização do Histórico de Versões
INSERT INTO public.app_versions (versao, titulo, resumo, autor, lancada_em, destaque, itens, tipo)
VALUES ('2.7.3', 'Correção Crítica: Provisão Diária', 'Correção do erro de persistência (NOT NULL constraint) no módulo de Provisão Diária.', 'Lucas Chaves', now(), true, 
'[
  {"categoria": "correcao", "descricao": "Provisão Diária: Corrigido erro que impedia a inserção/edição devido à ausência da coluna ''mês'' no payload."},
  {"categoria": "seguranca", "descricao": "Integridade de Dados: Implementado fallback automático para o campo ''mês'' baseado na data do lançamento."},
  {"categoria": "melhoria", "descricao": "Banco de Dados: Adicionado valor padrão para a coluna ''mês'' para evitar falhas em integrações externas."}
]', 'patch')
ON CONFLICT (versao) DO UPDATE 
SET titulo = EXCLUDED.titulo,
    resumo = EXCLUDED.resumo,
    itens = EXCLUDED.itens,
    lancada_em = EXCLUDED.lancada_em,
    destaque = EXCLUDED.destaque;
