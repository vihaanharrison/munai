
ALTER TABLE public.committees
  ADD COLUMN IF NOT EXISTS crisis_mode_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS crisis_extra_members text DEFAULT '',
  ADD COLUMN IF NOT EXISTS custom_tabs jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.standalone_committees
  ADD COLUMN IF NOT EXISTS crisis_mode_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS crisis_extra_members text DEFAULT '',
  ADD COLUMN IF NOT EXISTS custom_tabs jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.chair_sessions
  ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;

ALTER TABLE public.crisis_triggers
  ADD COLUMN IF NOT EXISTS parent_id uuid;

ALTER TABLE public.pois
  ADD COLUMN IF NOT EXISTS to_chair boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.unmod_caucus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id uuid NOT NULL,
  committee_id uuid NOT NULL,
  topic text NOT NULL,
  duration_seconds int DEFAULT 600,
  started_at timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.unmod_caucus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read unmod" ON public.unmod_caucus FOR SELECT USING (true);
CREATE POLICY "Anyone can insert unmod" ON public.unmod_caucus FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update unmod" ON public.unmod_caucus FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete unmod" ON public.unmod_caucus FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS public.custom_tab_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id uuid,
  committee_id uuid NOT NULL,
  tab_id text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  author text,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.custom_tab_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read custom" ON public.custom_tab_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert custom" ON public.custom_tab_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update custom" ON public.custom_tab_entries FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete custom" ON public.custom_tab_entries FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.unmod_caucus;
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_tab_entries;
