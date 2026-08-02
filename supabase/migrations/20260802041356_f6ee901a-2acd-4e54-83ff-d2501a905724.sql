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
    '1.7.2',
    NOW(),
    'patch',
    'Correção de Vulnerabilidades Críticas',
    'Esta versão finaliza a correção das vulnerabilidades críticas identificadas, garantindo a conformidade total com os requisitos de segurança e governança.',
    '[
        {"categoria": "seguranca", "descricao": "Load the security issues from the scan results and fix the selected issues."},
        {"categoria": "seguranca", "descricao": "Consolidação das permissões de execução para funções SECURITY DEFINER."},
        {"categoria": "seguranca", "descricao": "Validação final das políticas RLS para prevenir acesso não autorizado."}
    ]'::jsonb,
    'Sistema',
    false
) ON CONFLICT (versao) DO UPDATE SET
    resumo = EXCLUDED.resumo,
    itens = EXCLUDED.itens,
    lancada_em = EXCLUDED.lancada_em;
