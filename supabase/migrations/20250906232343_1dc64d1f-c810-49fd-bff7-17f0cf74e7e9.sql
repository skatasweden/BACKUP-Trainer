-- Fix remaining database function security issues - Add proper search paths

CREATE OR REPLACE FUNCTION public.refresh_auth_monitoring()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.set_coach_id_on_protocols()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.coach_id := auth.uid();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Prevent users from changing their own role unless they are a coach
  IF OLD.user_id = auth.uid() AND OLD.role != NEW.role THEN
    IF get_user_role() != 'coach'::text THEN
      RAISE EXCEPTION 'Cannot change your own role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT true
$$;

CREATE OR REPLACE FUNCTION public.has_program_access(p_program_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  select exists (
    select 1
    from public.program_access pa
    where pa.program_id = p_program_id
      and pa.user_id    = auth.uid()
      and (pa.expires_at is null or pa.expires_at > now())
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_program(p_program_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  select exists (
    select 1
    from public.programs pr
    where pr.id = p_program_id
      and pr.coach_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_workout(p_workout_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  select exists (
    select 1
    from public.program_items pi
    join public.program_access pa on pa.program_id = pi.program_id
    where pi.workout_id = p_workout_id
      and pa.user_id    = auth.uid()
      and (pa.expires_at is null or pa.expires_at > now())
  );
$$;

CREATE OR REPLACE FUNCTION public.set_coach_id_to_auth_uid()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
begin
  if new.coach_id is null then
    new.coach_id := auth.uid();
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(role::text, 'athlete') 
    FROM public.profiles 
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(p_email text, p_ip_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    email_count integer;
    ip_count integer;
    max_email_attempts constant integer := 5; -- Max 5 attempts per email in window
    max_ip_attempts constant integer := 10;   -- Max 10 attempts per IP in window
    time_window constant interval := '30 minutes';
BEGIN
    -- Count recent attempts for this email
    SELECT COUNT(*) INTO email_count
    FROM auth_otp_tracking
    WHERE email = p_email
    AND attempt_time > now() - time_window;
    
    -- Count recent attempts from this IP
    SELECT COUNT(*) INTO ip_count
    FROM auth_otp_tracking
    WHERE ip_address = p_ip_address
    AND attempt_time > now() - time_window;
    
    -- Record this attempt
    INSERT INTO auth_otp_tracking (email, ip_address)
    VALUES (p_email, p_ip_address);
    
    -- Return false if rate limit exceeded
    RETURN NOT (email_count >= max_email_attempts OR ip_count >= max_ip_attempts);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_otp_success(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Update the most recent attempt for this email as successful
    UPDATE auth_otp_tracking
    SET is_successful = true
    WHERE id = (
        SELECT id 
        FROM auth_otp_tracking
        WHERE email = p_email
        ORDER BY attempt_time DESC
        LIMIT 1
    );
END;
$$;