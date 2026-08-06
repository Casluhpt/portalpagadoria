-- Atualização do Histórico de Versões para v2.7.5
INSERT INTO public.app_versions (versao, titulo, resumo, autor, lancada_em, destaque, itens, tipo)
VALUES ('2.7.5', 'Segurança: Restrição de Documentação Técnica', 'Acesso aos downloads de documentação técnica e código-fonte restrito ao administrador principal.', 'Lucas Chaves', now(), true, 
'[
  {"categoria": "seguranca", "descricao": "Downloads Técnicos: Botões de download de PDF e Código-Fonte agora são visíveis exclusivamente para o email lucas.chaves.lc2001@gmail.com."},
  {"categoria": "seguranca", "descricao": "Governança: Removido acesso automático de outros administradores aos arquivos sensíveis do sistema."},
  {"categoria": "melhoria", "descricao": "Instruções de Sistema: Atualizado o contexto de segurança para o motor de IA do portal."}
]', 'patch')
ON CONFLICT (versao) DO UPDATE 
SET titulo = EXCLUDED.titulo,
    resumo = EXCLUDED.resumo,
    itens = EXCLUDED.itens,
    lancada_em = EXCLUDED.lancada_em,
    destaque = EXCLUDED.destaque;
