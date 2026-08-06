INSERT INTO public.app_versions (versao, titulo, resumo, tipo, autor)
VALUES (
  'v2.7.9', 
  'Controle de Disponibilidade da IA', 
  'Implementado interruptor mestre em Configurações > Segurança para o administrador alternar o status da IA entre Online e Offline.',
  'patch',
  'Administração'
);

UPDATE public.app_config 
SET value = '"v2.7.9"'::jsonb 
WHERE key = 'current_system_version';
