-- Implementação de Regras de Negócio e Segurança para o Setor Pagadoria (v2.2.1)
-- Restrição: O setor 'PAGADORIA' é administrativo e sensível. 
-- Deve ser atribuído exclusivamente por administradores.
-- Bloqueio preventivo no trigger de novos usuários.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_setor TEXT;
BEGIN
  v_setor := NULLIF(NEW.raw_user_meta_data->>'setor', '');
  
  -- Segurança: Impede que usuários se auto-atribuam ao setor PAGADORIA durante o cadastro.
  IF v_setor = 'PAGADORIA' THEN
    v_setor := NULL;
  END IF;

  INSERT INTO public.profiles (id, email, nome, setor)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    v_setor
  )
  ON CONFLICT (id) DO UPDATE
    SET setor = CASE 
                  WHEN EXCLUDED.setor = 'PAGADORIA' THEN public.profiles.setor 
                  ELSE COALESCE(EXCLUDED.setor, public.profiles.setor)
                END;
  RETURN NEW;
END;
$function$;

-- Comentário de Auditoria
COMMENT ON FUNCTION public.handle_new_user() IS 'Cria o perfil do usuário e impede auto-atribuição ao setor sensível PAGADORIA.';