
-- Fix security definer view
DROP VIEW IF EXISTS public.conferences_public;
CREATE VIEW public.conferences_public
WITH (security_invoker = true)
AS
SELECT id, name, start_date, end_date, location, email, 
       payment_link, payment_amount, payment_details,
       logo_url, banner_url, public_code, secgen_user_id,
       created_at, updated_at
FROM conferences;
