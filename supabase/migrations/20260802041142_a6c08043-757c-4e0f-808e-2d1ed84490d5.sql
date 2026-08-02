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
    '1.7.1',
    NOW(),
    'patch',
    'Segurança e Governança de Dados',
    'Esta versão foca na correção de vulnerabilidades críticas e no fortalecimento da governança de dados conforme as diretrizes de segurança do portal.',
    '[
        {"categoria": "seguranca", "descricao": "Habilitado Row Level Security (RLS) em todas as tabelas do banco de dados."},
        {"categoria": "seguranca", "descricao": "Implementadas políticas de acesso restritas baseadas em funções (Administrador, Auditor, Usuário)."},
        {"categoria": "seguranca", "descricao": "Proteção contra path hijacking em funções de banco de dados (search_path fixo)."},
        {"categoria": "seguranca", "descricao": "Revogadas permissões de execução pública e anônima em funções críticas."},
        {"categoria": "melhoria", "descricao": "Correção de vulnerabilidades identificadas pelo linter de segurança do Supabase."}
    ]'::jsonb,
    'Sistema',
    true
) ON CONFLICT (versao) DO UPDATE SET
    resumo = EXCLUDED.resumo,
    itens = EXCLUDED.itens,
    lancada_em = EXCLUDED.lancada_em;
