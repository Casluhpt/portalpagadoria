CREATE TABLE IF NOT EXISTS public.ia_conversas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT ON public.ia_conversas TO authenticated;
GRANT ALL ON public.ia_conversas TO service_role;

ALTER TABLE public.ia_conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" 
ON public.ia_conversas FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" 
ON public.ia_conversas FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.ia_user_patterns (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    patterns JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.ia_user_patterns TO authenticated;
GRANT ALL ON public.ia_user_patterns TO service_role;

ALTER TABLE public.ia_user_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own patterns" 
ON public.ia_user_patterns FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own patterns" 
ON public.ia_user_patterns FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patterns" 
ON public.ia_user_patterns FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);