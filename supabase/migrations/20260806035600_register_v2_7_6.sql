INSERT INTO public.app_versions (versao, lancada_em, titulo, resumo, itens, destaque)
VALUES (
  'v2.7.6',
  NOW(),
  'Interação Minimalista e Refinamento Visual',
  'Implementação de efeitos sutis de hover em botões, links e cards para reforçar a estética Minimalismo Translúcido. Feedback visual aprimorado para elementos coloridos e componentes com transparência (glassmorphism).',
  '["Efeito hover em botões (elevação e brilho)", "Interação em cards de vidro (backdrop-filter)", "Saturação sutil em elementos coloridos"]'::jsonb,
  true
) ON CONFLICT (versao) DO UPDATE SET 
  lancada_em = EXCLUDED.lancada_em,
  titulo = EXCLUDED.titulo,
  resumo = EXCLUDED.resumo,
  itens = EXCLUDED.itens,
  destaque = EXCLUDED.destaque;
