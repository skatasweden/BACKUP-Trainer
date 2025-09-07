-- Fix Security Issues: Enable RLS and Secure Views

-- 1. Enable RLS on auth_otp_tracking table
ALTER TABLE public.auth_otp_tracking ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for auth_otp_tracking (only system functions should access this)
CREATE POLICY "System access only for auth_otp_tracking" 
ON public.auth_otp_tracking 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- 3. Drop existing views that may have security definer issues
DROP VIEW IF EXISTS public.auth_failed_attempts CASCADE;
DROP VIEW IF EXISTS public.auth_suspicious_activity CASCADE;

-- 4. Recreate views as tables with proper RLS (safer approach)
CREATE TABLE public.auth_failed_attempts (
  email text,
  ip_address text,
  attempt_count bigint,
  first_attempt timestamp with time zone,
  last_attempt timestamp with time zone
);

CREATE TABLE public.auth_suspicious_activity (
  email text,
  ip_address text,
  attempt_count bigint,
  first_attempt timestamp with time zone,
  last_attempt timestamp with time zone
);

-- 5. Enable RLS on new tables
ALTER TABLE public.auth_failed_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_suspicious_activity ENABLE ROW LEVEL SECURITY;

-- 6. Create secure policies (only coaches can view auth monitoring data)
CREATE POLICY "Only coaches can view failed attempts" 
ON public.auth_failed_attempts 
FOR SELECT 
USING (is_coach());

CREATE POLICY "Only coaches can view suspicious activity" 
ON public.auth_suspicious_activity 
FOR SELECT 
USING (is_coach());

-- 7. Create secure functions to populate these tables (replace the views)
CREATE OR REPLACE FUNCTION public.refresh_auth_monitoring()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear existing data
  DELETE FROM auth_failed_attempts;
  DELETE FROM auth_suspicious_activity;
  
  -- Populate failed attempts
  INSERT INTO auth_failed_attempts (email, ip_address, attempt_count, first_attempt, last_attempt)
  SELECT 
    email,
    ip_address,
    count(*) AS attempt_count,
    min(attempt_time) AS first_attempt,
    max(attempt_time) AS last_attempt
  FROM auth_otp_tracking 
  WHERE NOT is_successful 
    AND attempt_time > (now() - interval '24 hours')
  GROUP BY email, ip_address
  HAVING count(*) > 0;
  
  -- Populate suspicious activity
  INSERT INTO auth_suspicious_activity (email, ip_address, attempt_count, first_attempt, last_attempt)
  SELECT email, ip_address, attempt_count, first_attempt, last_attempt
  FROM auth_failed_attempts
  WHERE attempt_count >= 5;
END;
$$;