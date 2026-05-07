ALTER TABLE public.delegates DROP CONSTRAINT IF EXISTS delegates_committee_id_fkey;
ALTER TABLE public.delegates DROP CONSTRAINT IF EXISTS delegates_conference_id_fkey;
CREATE INDEX IF NOT EXISTS delegates_committee_idx ON public.delegates(committee_id, active);