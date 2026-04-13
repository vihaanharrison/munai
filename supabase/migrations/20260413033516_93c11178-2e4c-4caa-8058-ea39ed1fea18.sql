-- Replace the overly permissive SELECT policy on conferences
-- Only the SecGen who owns the conference should see the full row (with codes)
DROP POLICY IF EXISTS "Anyone can read conferences" ON public.conferences;

CREATE POLICY "SecGen can read own conferences"
ON public.conferences
FOR SELECT
TO authenticated
USING (secgen_user_id = auth.uid());

-- Also allow the lookup_code function (SECURITY DEFINER) to still work
-- since it runs as the function owner, not as the calling user.
-- The conferences_public view already exists for public access without codes.