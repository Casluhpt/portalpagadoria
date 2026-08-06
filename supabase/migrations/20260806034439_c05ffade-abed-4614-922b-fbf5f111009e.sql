UPDATE public.app_versions SET 
  titulo = 'Finalização da Organização do Sistema',
  resumo = 'Revisão final de navegação, governança administrativa e padronização visual.',
  itens = '[{"categoria": "novo", "descricao": "Indicador de Status do Sistema Online no menu lateral"}, {"categoria": "melhoria", "descricao": "Atalho direto para Conciliação de Líquidos no menu"}, {"categoria": "melhoria", "descricao": "Padronização de datas para formato brasileiro em Despesas Fixas"}, {"categoria": "seguranca", "descricao": "Reforço nas restrições de documentação técnica"}]',
  autor = 'Lovable'
WHERE versao = '2.7.5';