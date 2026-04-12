
-- Standalone committees table
CREATE TABLE public.standalone_committees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  topic TEXT,
  delegations TEXT DEFAULT '',
  chair_code TEXT NOT NULL,
  committee_code TEXT NOT NULL,
  crisis_enabled BOOLEAN DEFAULT false,
  scoring_columns JSONB DEFAULT '["Speaking", "Research", "POIs", "Diplomacy", "Leadership", "Content", "Overall"]'::jsonb,
  created_by_device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.standalone_committees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read standalone committees" ON public.standalone_committees FOR SELECT USING (true);
CREATE POLICY "Anyone can insert standalone committees" ON public.standalone_committees FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update standalone committees" ON public.standalone_committees FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete standalone committees" ON public.standalone_committees FOR DELETE USING (true);

-- Planned notes table
CREATE TABLE public.planned_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT DEFAULT '',
  owner_type TEXT NOT NULL, -- 'secgen', 'chair'
  owner_id TEXT NOT NULL, -- device_id or user_id
  conference_id UUID,
  committee_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.planned_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read planned notes" ON public.planned_notes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert planned notes" ON public.planned_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update planned notes" ON public.planned_notes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete planned notes" ON public.planned_notes FOR DELETE USING (true);

-- Add missing UPDATE/DELETE policies on pois
CREATE POLICY "Anyone can update pois" ON public.pois FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete pois" ON public.pois FOR DELETE USING (true);

-- Enable realtime for standalone committees
ALTER PUBLICATION supabase_realtime ADD TABLE public.standalone_committees;
