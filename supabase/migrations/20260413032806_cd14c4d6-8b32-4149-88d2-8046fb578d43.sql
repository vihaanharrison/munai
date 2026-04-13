
-- RPC for SecGen to get their own conference codes
CREATE OR REPLACE FUNCTION public.get_conference_codes(conf_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'secgen_code', c.secgen_code,
    'secretariat_code', c.secretariat_code,
    'public_code', c.public_code
  )
  INTO result
  FROM conferences c
  WHERE c.id = conf_id AND c.secgen_user_id = auth.uid();
  
  IF result IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authorized');
  END IF;
  
  RETURN result;
END;
$$;

-- RPC for SecGen to get chair codes for their committees
CREATE OR REPLACE FUNCTION public.get_committee_chair_code(comm_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code text;
BEGIN
  SELECT c.chair_code INTO code
  FROM committees c
  JOIN conferences conf ON conf.id = c.conference_id
  WHERE c.id = comm_id AND conf.secgen_user_id = auth.uid();
  
  RETURN code;
END;
$$;
