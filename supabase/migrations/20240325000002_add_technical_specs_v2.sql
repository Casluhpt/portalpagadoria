INSERT INTO public.app_versions (
  versao, 
  lancada_em, 
  tipo, 
  titulo, 
  resumo, 
  itens, 
  destaque
) VALUES (
  '2.0.0', 
  NOW(), 
  'major', 
  'Especificação Técnica e Engenharia de Prompt: Fila Virtual, Atualização de Despesas Fixas e Canal de Suporte', 
  'Aqui está o compilado detalhado das informações fornecidas, estruturado especificamente no formato de especificações técnicas...', 
  '[
    {"categoria": "novo", "descricao": "Módulo de Configurações e Canal de Suporte Técnico com fluxos automatizados."},
    {"categoria": "novo", "descricao": "Sistema de Fila Virtual e Controle de Concorrência para Pagamentos Diversos."},
    {"categoria": "melhoria", "descricao": "Atualização Estrutural do Módulo de Despesas Fixas (Múltiplos lançamentos, Gestão Orçamentária)."},
    {"categoria": "seguranca", "descricao": "Requisitos de Arquitetura e Engenharia de Software para escalabilidade e tempo real."}
  ]',
  true
) ON CONFLICT (versao) DO UPDATE SET 
  titulo = EXCLUDED.titulo,
  resumo = EXCLUDED.resumo,
  itens = EXCLUDED.itens,
  destaque = EXCLUDED.destaque;
