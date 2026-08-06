DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pagamentos_audit' AND column_name='user_id') THEN
    ALTER TABLE public.pagamentos_audit RENAME COLUMN usuario_id TO user_id;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pagamentos_audit' AND column_name='user_nome') THEN
    ALTER TABLE public.pagamentos_audit RENAME COLUMN usuario_nome TO user_nome;
  END IF;
END $$;