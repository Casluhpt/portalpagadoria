INSERT INTO public.app_versions (
    versao,
    lancada_em,
    tipo,
    titulo,
    resumo,
    itens,
    autor,
    destaque
) VALUES (
    '1.8.0',
    NOW(),
    'minor',
    'Governança e Tratamento de Erros em Importações',
    'Implementação de diretrizes rigorosas para importações de arquivos Excel, garantindo integridade de dados e auditoria completa.',
    '[
        {"categoria": "novo", "descricao": "Tratamento de erros nas importações Excel com validação automática de colunas e identificação de campos vazios."},
        {"categoria": "melhoria", "descricao": "Relatórios de erros pré-importação e opção de cancelamento para evitar corrupção da base."},
        {"categoria": "melhoria", "descricao": "Confirmação obrigatória antes de substituir bases de dados críticas."},
        {"categoria": "seguranca", "descricao": "Auditoria completa: identificação de quem importou, data e hora exata da operação."},
        {"categoria": "melhoria", "descricao": "Histórico de arquivos importados e identificação de linhas duplicadas."}
    ]'::jsonb,
    'Sistema',
    true
) ON CONFLICT (versao) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    resumo = EXCLUDED.resumo,
    itens = EXCLUDED.itens,
    lancada_em = EXCLUDED.lancada_em;
