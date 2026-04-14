
-- Event registration custom questions
CREATE TABLE IF NOT EXISTS public.conference_custom_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id uuid NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.conference_custom_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read questions" ON public.conference_custom_questions
  FOR SELECT USING (true);

CREATE POLICY "SecGen can insert questions" ON public.conference_custom_questions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM conferences WHERE id = conference_id AND secgen_user_id = auth.uid()));

CREATE POLICY "SecGen can update questions" ON public.conference_custom_questions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM conferences WHERE id = conference_id AND secgen_user_id = auth.uid()));

CREATE POLICY "SecGen can delete questions" ON public.conference_custom_questions
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM conferences WHERE id = conference_id AND secgen_user_id = auth.uid()));

-- Event registrations
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id uuid NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  custom_responses jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(conference_id, user_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own registration" ON public.event_registrations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own registration" ON public.event_registrations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM conferences WHERE id = conference_id AND secgen_user_id = auth.uid()));

-- Add published flag to conferences
ALTER TABLE public.conferences ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;

-- Drop and recreate view with correct column order
DROP VIEW IF EXISTS public.conferences_public;
CREATE VIEW public.conferences_public AS
  SELECT id, name, start_date, end_date, location, email,
         payment_link, payment_amount, payment_details,
         logo_url, banner_url, public_code, secgen_user_id,
         created_at, updated_at, published
  FROM public.conferences;

-- Add missing FK constraints for data integrity
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blocs_committee_id_fkey') THEN
    ALTER TABLE public.blocs ADD CONSTRAINT blocs_committee_id_fkey FOREIGN KEY (committee_id) REFERENCES public.committees(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blocs_conference_id_fkey') THEN
    ALTER TABLE public.blocs ADD CONSTRAINT blocs_conference_id_fkey FOREIGN KEY (conference_id) REFERENCES public.conferences(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crisis_triggers_committee_id_fkey') THEN
    ALTER TABLE public.crisis_triggers ADD CONSTRAINT crisis_triggers_committee_id_fkey FOREIGN KEY (committee_id) REFERENCES public.committees(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crisis_triggers_conference_id_fkey') THEN
    ALTER TABLE public.crisis_triggers ADD CONSTRAINT crisis_triggers_conference_id_fkey FOREIGN KEY (conference_id) REFERENCES public.conferences(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'speakers_list_committee_id_fkey') THEN
    ALTER TABLE public.speakers_list ADD CONSTRAINT speakers_list_committee_id_fkey FOREIGN KEY (committee_id) REFERENCES public.committees(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'speakers_list_conference_id_fkey') THEN
    ALTER TABLE public.speakers_list ADD CONSTRAINT speakers_list_conference_id_fkey FOREIGN KEY (conference_id) REFERENCES public.conferences(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'speakers_list_delegate_id_fkey') THEN
    ALTER TABLE public.speakers_list ADD CONSTRAINT speakers_list_delegate_id_fkey FOREIGN KEY (delegate_id) REFERENCES public.delegates(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mod_caucus_committee_id_fkey') THEN
    ALTER TABLE public.mod_caucus ADD CONSTRAINT mod_caucus_committee_id_fkey FOREIGN KEY (committee_id) REFERENCES public.committees(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mod_caucus_conference_id_fkey') THEN
    ALTER TABLE public.mod_caucus ADD CONSTRAINT mod_caucus_conference_id_fkey FOREIGN KEY (conference_id) REFERENCES public.conferences(id) ON DELETE CASCADE;
  END IF;
END $$;
