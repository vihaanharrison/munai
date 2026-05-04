-- User profiles for the Account / Discover system
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  mun_experience TEXT,
  conferences_attended TEXT,
  awards JSONB DEFAULT '[]'::jsonb,
  awards_raw TEXT,
  socials JSONB DEFAULT '{}'::jsonb,
  avatar_url TEXT,
  visible_in_discover BOOLEAN DEFAULT false,
  preferred_role TEXT,
  chair_eligible BOOLEAN GENERATED ALWAYS AS (jsonb_array_length(coalesce(awards, '[]'::jsonb)) >= 2) STORED,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Public profiles visible in discover" ON public.profiles
  FOR SELECT TO authenticated USING (visible_in_discover = true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Conference end window (manual end after day-3, 48h archive window)
ALTER TABLE public.conferences
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

ALTER TABLE public.standalone_committees
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
