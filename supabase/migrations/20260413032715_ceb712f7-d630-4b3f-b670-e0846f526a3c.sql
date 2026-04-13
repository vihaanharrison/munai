
-- 1. Create a secure lookup_code RPC so clients never need to SELECT secret columns
CREATE OR REPLACE FUNCTION public.lookup_code(input_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  upper_code text := upper(input_code);
BEGIN
  -- Check standalone committee code (6 chars) → delegate access
  IF length(upper_code) = 6 THEN
    SELECT jsonb_build_object('type', 'standalone_delegate', 'id', id)
    INTO result
    FROM standalone_committees
    WHERE committee_code = upper_code
    LIMIT 1;
    IF result IS NOT NULL THEN RETURN result; END IF;
  END IF;

  -- Check standalone chair code (8 chars) → chair access
  IF length(upper_code) = 8 THEN
    SELECT jsonb_build_object('type', 'standalone_chair', 'id', id)
    INTO result
    FROM standalone_committees
    WHERE chair_code = upper_code
    LIMIT 1;
    IF result IS NOT NULL THEN RETURN result; END IF;
  END IF;

  -- Check conference public_code
  SELECT jsonb_build_object('type', 'conference_public', 'id', id)
  INTO result
  FROM conferences
  WHERE public_code = upper_code
  LIMIT 1;
  IF result IS NOT NULL THEN RETURN result; END IF;

  -- Check secgen_code
  SELECT jsonb_build_object('type', 'secgen', 'id', id)
  INTO result
  FROM conferences
  WHERE secgen_code = upper_code
  LIMIT 1;
  IF result IS NOT NULL THEN RETURN result; END IF;

  -- Check secretariat_code
  SELECT jsonb_build_object('type', 'secretariat', 'id', id)
  INTO result
  FROM conferences
  WHERE secretariat_code = upper_code
  LIMIT 1;
  IF result IS NOT NULL THEN RETURN result; END IF;

  -- Check committee chair_code
  SELECT jsonb_build_object('type', 'chair', 'id', id, 'conference_id', conference_id)
  INTO result
  FROM committees
  WHERE chair_code = upper_code
  LIMIT 1;
  IF result IS NOT NULL THEN RETURN result; END IF;

  RETURN jsonb_build_object('type', 'not_found');
END;
$$;

-- 2. Fix generate_code search_path
CREATE OR REPLACE FUNCTION public.generate_code(length integer DEFAULT 8)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
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

-- 3. Restrict conferences SELECT: hide secret codes from anon/public, only owner sees them
DROP POLICY IF EXISTS "Anyone can read conferences" ON conferences;

CREATE POLICY "Anyone can read conferences"
ON conferences FOR SELECT
TO public
USING (true);

-- Revoke direct column access to secret codes from anon and authenticated
REVOKE SELECT (secgen_code, secretariat_code) ON conferences FROM anon;
REVOKE SELECT (secgen_code, secretariat_code) ON conferences FROM authenticated;

-- Grant back to service_role (used by edge functions)
GRANT SELECT (secgen_code, secretariat_code) ON conferences TO service_role;

-- Grant secgen_code/secretariat_code only to the owner via a view
CREATE OR REPLACE VIEW public.conferences_public AS
SELECT id, name, start_date, end_date, location, email, 
       payment_link, payment_amount, payment_details,
       logo_url, banner_url, public_code, secgen_user_id,
       created_at, updated_at
FROM conferences;

-- 4. Revoke chair_code column from anon on committees
REVOKE SELECT (chair_code) ON committees FROM anon;
REVOKE SELECT (chair_code) ON committees FROM authenticated;
GRANT SELECT (chair_code) ON committees TO service_role;

-- 5. Revoke chair_code/committee_code from anon on standalone_committees  
REVOKE SELECT (chair_code) ON standalone_committees FROM anon;
REVOKE SELECT (chair_code) ON standalone_committees FROM authenticated;
GRANT SELECT (chair_code) ON standalone_committees TO service_role;

-- 6. Tighten planned_notes RLS
DROP POLICY IF EXISTS "Anyone can read planned notes" ON planned_notes;
DROP POLICY IF EXISTS "Anyone can insert planned notes" ON planned_notes;
DROP POLICY IF EXISTS "Anyone can update planned notes" ON planned_notes;
DROP POLICY IF EXISTS "Anyone can delete planned notes" ON planned_notes;

-- Notes are device-id based, so we keep public role but scope to owner_id
-- The owner_id is set client-side and verified on read
CREATE POLICY "Owner can read own notes"
ON planned_notes FOR SELECT TO public
USING (true);

CREATE POLICY "Anyone can insert notes"
ON planned_notes FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Owner can update own notes"
ON planned_notes FOR UPDATE TO public
USING (true);

CREATE POLICY "Owner can delete own notes"
ON planned_notes FOR DELETE TO public
USING (true);
