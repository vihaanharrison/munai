
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('secgen', 'secretariat', 'chair', 'delegate');

-- Conferences table
CREATE TABLE public.conferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT,
  email TEXT,
  payment_link TEXT,
  payment_amount TEXT,
  payment_details TEXT,
  logo_url TEXT,
  banner_url TEXT,
  secgen_code TEXT NOT NULL UNIQUE,
  secretariat_code TEXT NOT NULL UNIQUE,
  public_code TEXT NOT NULL UNIQUE,
  secgen_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conference daily timings
CREATE TABLE public.conference_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

-- Schedule sessions
CREATE TABLE public.schedule_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  sort_order INT DEFAULT 0
);

-- Committees
CREATE TABLE public.committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  topic TEXT,
  chair_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  display_name TEXT,
  role_title TEXT,
  permissions JSONB DEFAULT '{}',
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, conference_id)
);

-- Chair sessions
CREATE TABLE public.chair_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  display_name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Delegates
CREATE TABLE public.delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  device_id TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chair_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegates ENABLE ROW LEVEL SECURITY;

-- Security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _conference_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND conference_id = _conference_id AND role = _role AND approved = true
  )
$$;

-- Generate code function
CREATE OR REPLACE FUNCTION public.generate_code(length INT DEFAULT 8)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- RLS Policies

-- Conferences
CREATE POLICY "Anyone can read conferences" ON public.conferences FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert conferences" ON public.conferences FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "SecGen can update own conferences" ON public.conferences FOR UPDATE TO authenticated USING (secgen_user_id = auth.uid());

-- Conference days
CREATE POLICY "Anyone can read conference days" ON public.conference_days FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert conference days" ON public.conference_days FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update conference days" ON public.conference_days FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete conference days" ON public.conference_days FOR DELETE TO authenticated USING (true);

-- Schedule sessions
CREATE POLICY "Anyone can read schedule" ON public.schedule_sessions FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert schedule" ON public.schedule_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update schedule" ON public.schedule_sessions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete schedule" ON public.schedule_sessions FOR DELETE TO authenticated USING (true);

-- Committees
CREATE POLICY "Anyone can read committees" ON public.committees FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert committees" ON public.committees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update committees" ON public.committees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete committees" ON public.committees FOR DELETE TO authenticated USING (true);

-- User roles
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "SecGen can read all roles for conference" ON public.user_roles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conferences WHERE id = conference_id AND secgen_user_id = auth.uid())
);
CREATE POLICY "Authenticated can insert own roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "SecGen can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conferences WHERE id = conference_id AND secgen_user_id = auth.uid())
);

-- Chair sessions (anon access for code-based auth)
CREATE POLICY "Anyone can read chair sessions" ON public.chair_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chair sessions" ON public.chair_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update chair sessions" ON public.chair_sessions FOR UPDATE USING (true);

-- Delegates (anon access for temporary registration)
CREATE POLICY "Anyone can read delegates" ON public.delegates FOR SELECT USING (true);
CREATE POLICY "Anyone can insert delegates" ON public.delegates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update delegates" ON public.delegates FOR UPDATE USING (true);
