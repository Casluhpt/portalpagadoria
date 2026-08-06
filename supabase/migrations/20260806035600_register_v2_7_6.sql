INSERT INTO public.app_versions (version, release_date, description, details)
VALUES (
  'v2.7.6',
  NOW(),
  'Interação Minimalista e Refinamento Visual',
  'Implementação de efeitos sutis de hover em botões, links e cards para reforçar a estética Minimalismo Translúcido. Feedback visual aprimorado para elementos coloridos e componentes com transparência (glassmorphism).'
) ON CONFLICT (version) DO UPDATE SET 
  release_date = EXCLUDED.release_date,
  description = EXCLUDED.description,
  details = EXCLUDED.details;
