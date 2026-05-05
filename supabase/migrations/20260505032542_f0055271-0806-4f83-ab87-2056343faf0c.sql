
ALTER TABLE public.committees ADD COLUMN IF NOT EXISTS committee_type text NOT NULL DEFAULT 'general';
ALTER TABLE public.standalone_committees ADD COLUMN IF NOT EXISTS committee_type text NOT NULL DEFAULT 'general';

DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='pois';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.pois; END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='blocs';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.blocs; END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='committee_agendas';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.committee_agendas; END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='conference_updates';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.conference_updates; END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='delegates';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.delegates; END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
