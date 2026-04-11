
-- Add status and marked to pois
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS marked boolean DEFAULT false;

-- Add scoring_columns to committees
ALTER TABLE public.committees ADD COLUMN IF NOT EXISTS scoring_columns jsonb DEFAULT '["Speaking","Research","POIs","Diplomacy","Leadership","Content","Overall"]';

-- Speakers list table
CREATE TABLE public.speakers_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id uuid NOT NULL,
  conference_id uuid NOT NULL,
  list_type text NOT NULL DEFAULT 'gsl',
  delegate_id uuid NOT NULL,
  position integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'upcoming',
  started_at timestamptz,
  duration_seconds integer DEFAULT 120,
  speech_text text,
  chair_feedback text,
  ai_score integer,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.speakers_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read speakers list" ON public.speakers_list FOR SELECT USING (true);
CREATE POLICY "Anyone can insert speakers list" ON public.speakers_list FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update speakers list" ON public.speakers_list FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete speakers list" ON public.speakers_list FOR DELETE USING (true);

-- Blocs table
CREATE TABLE public.blocs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id uuid NOT NULL,
  conference_id uuid NOT NULL,
  name text NOT NULL,
  discussion_status text DEFAULT 'yet_to_discuss',
  file_url text,
  file_name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.blocs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read blocs" ON public.blocs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert blocs" ON public.blocs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update blocs" ON public.blocs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete blocs" ON public.blocs FOR DELETE USING (true);

-- Add bloc_id and is_leader to delegate_blocs
ALTER TABLE public.delegate_blocs ADD COLUMN IF NOT EXISTS bloc_id uuid;
ALTER TABLE public.delegate_blocs ADD COLUMN IF NOT EXISTS is_leader boolean DEFAULT false;

-- Mod caucus table
CREATE TABLE public.mod_caucus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id uuid NOT NULL,
  conference_id uuid NOT NULL,
  topic text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.mod_caucus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read mod caucus" ON public.mod_caucus FOR SELECT USING (true);
CREATE POLICY "Anyone can insert mod caucus" ON public.mod_caucus FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update mod caucus" ON public.mod_caucus FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete mod caucus" ON public.mod_caucus FOR DELETE USING (true);

-- Crisis triggers table
CREATE TABLE public.crisis_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id uuid NOT NULL,
  conference_id uuid NOT NULL,
  content text,
  file_url text,
  file_name text,
  ai_summary text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.crisis_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read crisis triggers" ON public.crisis_triggers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert crisis triggers" ON public.crisis_triggers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update crisis triggers" ON public.crisis_triggers FOR UPDATE USING (true);

-- Enable realtime for speakers list and pois
ALTER PUBLICATION supabase_realtime ADD TABLE public.speakers_list;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pois;
