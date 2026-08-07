CREATE TABLE IF NOT EXISTS public.notification_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'sent', 'read', 'dismissed', 'bulk_deleted'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT ON public.notification_audit TO authenticated;
GRANT ALL ON public.notification_audit TO service_role;

ALTER TABLE public.notification_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification audit logs"
    ON public.notification_audit
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Users can insert their own audit logs"
    ON public.notification_audit
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
