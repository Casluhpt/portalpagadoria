ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS planilha_inteligente boolean,
  ADD COLUMN IF NOT EXISTS planilha_onboarding_em timestamptz;

COMMENT ON COLUMN public.profiles.planilha_inteligente IS 'Preferência do usuário: true = Modo Inteligente (Planilha Inteligente ativa), false = Modo Tradicional, null = ainda não escolheu.';
COMMENT ON COLUMN public.profiles.planilha_onboarding_em IS 'Data/hora em que o usuário foi apresentado à Planilha Inteligente no primeiro acesso.';