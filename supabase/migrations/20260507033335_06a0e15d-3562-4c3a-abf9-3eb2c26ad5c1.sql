ALTER TABLE public.chair_sessions DROP CONSTRAINT IF EXISTS chair_sessions_committee_id_fkey;
ALTER TABLE public.chair_sessions DROP CONSTRAINT IF EXISTS chair_sessions_conference_id_fkey;
ALTER TABLE public.chair_sessions ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'conference';
ALTER TABLE public.chair_sessions DROP CONSTRAINT IF EXISTS chair_sessions_source_check;
ALTER TABLE public.chair_sessions ADD CONSTRAINT chair_sessions_source_check CHECK (source IN ('conference','standalone'));
CREATE INDEX IF NOT EXISTS chair_sessions_committee_idx ON public.chair_sessions(committee_id, active);

ALTER TABLE public.standalone_committees ADD COLUMN IF NOT EXISTS created_by_user_id uuid;
CREATE INDEX IF NOT EXISTS standalone_committees_creator_idx ON public.standalone_committees(created_by_user_id, ended_at);