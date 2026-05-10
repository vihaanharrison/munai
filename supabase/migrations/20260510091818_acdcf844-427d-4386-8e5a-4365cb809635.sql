ALTER TABLE public.speakers_list DROP CONSTRAINT IF EXISTS speakers_list_committee_id_fkey;
ALTER TABLE public.speakers_list DROP CONSTRAINT IF EXISTS speakers_list_conference_id_fkey;
ALTER TABLE public.speakers_list DROP CONSTRAINT IF EXISTS speakers_list_delegate_id_fkey;
ALTER TABLE public.mod_caucus DROP CONSTRAINT IF EXISTS mod_caucus_committee_id_fkey;
ALTER TABLE public.mod_caucus DROP CONSTRAINT IF EXISTS mod_caucus_conference_id_fkey;
ALTER TABLE public.unmod_caucus DROP CONSTRAINT IF EXISTS unmod_caucus_committee_id_fkey;
ALTER TABLE public.unmod_caucus DROP CONSTRAINT IF EXISTS unmod_caucus_conference_id_fkey;
ALTER TABLE public.pois DROP CONSTRAINT IF EXISTS pois_committee_id_fkey;
ALTER TABLE public.pois DROP CONSTRAINT IF EXISTS pois_conference_id_fkey;
ALTER TABLE public.pois DROP CONSTRAINT IF EXISTS pois_from_delegate_id_fkey;
ALTER TABLE public.pois DROP CONSTRAINT IF EXISTS pois_to_delegate_id_fkey;
ALTER TABLE public.blocs DROP CONSTRAINT IF EXISTS blocs_committee_id_fkey;
ALTER TABLE public.blocs DROP CONSTRAINT IF EXISTS blocs_conference_id_fkey;
ALTER TABLE public.delegate_blocs DROP CONSTRAINT IF EXISTS delegate_blocs_committee_id_fkey;
ALTER TABLE public.delegate_blocs DROP CONSTRAINT IF EXISTS delegate_blocs_conference_id_fkey;
ALTER TABLE public.delegate_blocs DROP CONSTRAINT IF EXISTS delegate_blocs_delegate_id_fkey;
ALTER TABLE public.delegate_blocs DROP CONSTRAINT IF EXISTS delegate_blocs_bloc_id_fkey;
ALTER TABLE public.delegate_documents DROP CONSTRAINT IF EXISTS delegate_documents_committee_id_fkey;
ALTER TABLE public.delegate_documents DROP CONSTRAINT IF EXISTS delegate_documents_conference_id_fkey;
ALTER TABLE public.delegate_documents DROP CONSTRAINT IF EXISTS delegate_documents_delegate_id_fkey;
ALTER TABLE public.custom_tab_entries DROP CONSTRAINT IF EXISTS custom_tab_entries_committee_id_fkey;
ALTER TABLE public.custom_tab_entries DROP CONSTRAINT IF EXISTS custom_tab_entries_conference_id_fkey;
ALTER TABLE public.committee_files DROP CONSTRAINT IF EXISTS committee_files_committee_id_fkey;
ALTER TABLE public.committee_files DROP CONSTRAINT IF EXISTS committee_files_conference_id_fkey;
ALTER TABLE public.committee_agendas DROP CONSTRAINT IF EXISTS committee_agendas_committee_id_fkey;
ALTER TABLE public.committee_agendas DROP CONSTRAINT IF EXISTS committee_agendas_conference_id_fkey;
ALTER TABLE public.crisis_triggers DROP CONSTRAINT IF EXISTS crisis_triggers_committee_id_fkey;
ALTER TABLE public.crisis_triggers DROP CONSTRAINT IF EXISTS crisis_triggers_conference_id_fkey;

ALTER TABLE public.chair_sessions ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS chair_sessions_committee_active_idx ON public.chair_sessions(committee_id, active, approved);
CREATE INDEX IF NOT EXISTS speakers_list_committee_idx ON public.speakers_list(committee_id, list_type);
CREATE INDEX IF NOT EXISTS pois_committee_idx ON public.pois(committee_id, status);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['speakers_list','mod_caucus','unmod_caucus','pois','conference_updates','committees','standalone_committees','chair_sessions']
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;