
-- AUDIT LOGS TABLE
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conference_id uuid,
  committee_id uuid,
  action text NOT NULL,
  actor_type text NOT NULL,
  actor_id text,
  actor_name text,
  target_table text,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SecGen can read audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (
  conference_id IS NULL 
  OR EXISTS (
    SELECT 1 FROM conferences c WHERE c.id = audit_logs.conference_id AND c.secgen_user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated can insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Anon can insert audit logs"
ON public.audit_logs FOR INSERT TO anon
WITH CHECK (true);

CREATE INDEX idx_audit_logs_conference ON public.audit_logs(conference_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- AUDIT LOGGING RPC
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_conference_id uuid DEFAULT NULL,
  p_committee_id uuid DEFAULT NULL,
  p_action text DEFAULT '',
  p_actor_type text DEFAULT 'system',
  p_actor_id text DEFAULT NULL,
  p_actor_name text DEFAULT NULL,
  p_target_table text DEFAULT NULL,
  p_target_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (conference_id, committee_id, action, actor_type, actor_id, actor_name, target_table, target_id, details)
  VALUES (p_conference_id, p_committee_id, p_action, p_actor_type, p_actor_id, p_actor_name, p_target_table, p_target_id, p_details);
END;
$$;

-- REALTIME FOR ADDITIONAL TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delegate_blocs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
