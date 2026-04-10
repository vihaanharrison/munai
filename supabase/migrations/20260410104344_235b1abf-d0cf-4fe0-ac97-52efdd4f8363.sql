
-- Add columns to committees
ALTER TABLE public.committees ADD COLUMN IF NOT EXISTS crisis_enabled boolean DEFAULT false;
ALTER TABLE public.committees ADD COLUMN IF NOT EXISTS delegations text DEFAULT '';

-- Add columns to delegates
ALTER TABLE public.delegates ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;
ALTER TABLE public.delegates ADD COLUMN IF NOT EXISTS marks jsonb DEFAULT '{}'::jsonb;

-- Committee agendas
CREATE TABLE public.committee_agendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id uuid NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  conference_id uuid NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_crisis_trigger boolean DEFAULT false,
  ai_summary text,
  file_url text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.committee_agendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read agendas" ON public.committee_agendas FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert agendas" ON public.committee_agendas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update agendas" ON public.committee_agendas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete agendas" ON public.committee_agendas FOR DELETE TO authenticated USING (true);

-- Delegate documents
CREATE TABLE public.delegate_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delegate_id uuid NOT NULL REFERENCES public.delegates(id) ON DELETE CASCADE,
  committee_id uuid NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  conference_id uuid NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('position_paper', 'gsl_speech')),
  file_url text,
  content text,
  ai_check_result jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.delegate_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read delegate docs" ON public.delegate_documents FOR SELECT USING (true);
CREATE POLICY "Anyone can insert delegate docs" ON public.delegate_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update delegate docs" ON public.delegate_documents FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete delegate docs" ON public.delegate_documents FOR DELETE USING (true);

-- Chat messages for secretariat
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id uuid NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  sender_user_id uuid,
  content text,
  file_url text,
  file_name text,
  channel text DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read chat" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert chat" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (true);

-- Secretariat tasks
CREATE TABLE public.secretariat_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id uuid NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean DEFAULT false,
  assigned_to text,
  created_by text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.secretariat_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read tasks" ON public.secretariat_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert tasks" ON public.secretariat_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update tasks" ON public.secretariat_tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete tasks" ON public.secretariat_tasks FOR DELETE TO authenticated USING (true);

-- Conference updates / announcements
CREATE TABLE public.conference_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id uuid NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  committee_id uuid REFERENCES public.committees(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_role text NOT NULL,
  title text,
  body text NOT NULL,
  image_url text,
  file_url text,
  file_name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.conference_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read updates" ON public.conference_updates FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert updates" ON public.conference_updates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete updates" ON public.conference_updates FOR DELETE TO authenticated USING (true);

-- Committee files (chair uploads)
CREATE TABLE public.committee_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id uuid NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  conference_id uuid NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  uploaded_by text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.committee_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read committee files" ON public.committee_files FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert committee files" ON public.committee_files FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete committee files" ON public.committee_files FOR DELETE TO authenticated USING (true);

-- POIs (points of information)
CREATE TABLE public.pois (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id uuid NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  committee_id uuid NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  from_delegate_id uuid NOT NULL REFERENCES public.delegates(id) ON DELETE CASCADE,
  to_delegate_id uuid NOT NULL REFERENCES public.delegates(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.pois ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pois" ON public.pois FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pois" ON public.pois FOR INSERT WITH CHECK (true);

-- Delegate blocs
CREATE TABLE public.delegate_blocs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id uuid NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  committee_id uuid NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  delegate_id uuid NOT NULL REFERENCES public.delegates(id) ON DELETE CASCADE,
  bloc_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.delegate_blocs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read blocs" ON public.delegate_blocs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert blocs" ON public.delegate_blocs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update blocs" ON public.delegate_blocs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete blocs" ON public.delegate_blocs FOR DELETE TO authenticated USING (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.delegates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conference_updates;

-- Storage bucket for conference files
INSERT INTO storage.buckets (id, name, public) VALUES ('conference-files', 'conference-files', true);
CREATE POLICY "Anyone can read conference files" ON storage.objects FOR SELECT USING (bucket_id = 'conference-files');
CREATE POLICY "Authenticated can upload conference files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'conference-files');
CREATE POLICY "Authenticated can delete conference files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'conference-files');
