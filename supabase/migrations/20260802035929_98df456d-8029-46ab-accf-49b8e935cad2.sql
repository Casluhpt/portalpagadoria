INSERT INTO public.app_versions (versao, lancada_em, tipo, titulo, resumo, itens, destaque)
VALUES (
  '1.7.0',
  '2026-08-02',
  'minor',
  'IA Assistente e Governança de Dados',
  'Lançamento do assistente de IA focado em orientar o usuário e garantir a segurança das operações.',
  '[
    {"categoria": "novo", "descricao": "IA Assistente: Respostas baseadas apenas em materiais autorizados."},
    {"categoria": "seguranca", "descricao": "Controle de acesso: IA restrita a dados permitidos ao usuário."},
    {"categoria": "seguranca", "descricao": "Ações críticas: IA não executa comandos sensíveis sem aceite do administrador."},
    {"categoria": "melhoria", "descricao": "Suporte ao usuário: Orientações passo a passo e sugestão de caminhos."},
    {"categoria": "melhoria", "descricao": "Debugging: Explicação de erros técnicos exclusiva para administradores."},
    {"categoria": "melhoria", "descricao": "Feedback: Opção para avaliar as respostas da IA."}
  ]'::jsonb,
  true
);