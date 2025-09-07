-- Phase 1: Critical RLS Policy Fixes

-- 1. Secure Admin Audit Log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for admin audit log - only coaches with admin privileges can access
CREATE POLICY "admin_audit_log_admin_only" 
ON public.admin_audit_log 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'coach'
    AND (p.user_id::text = ANY(
      SELECT jsonb_array_elements_text(
        COALESCE((auth.jwt() -> 'app_metadata' -> 'admin_users')::jsonb, '[]'::jsonb)
      )
    ))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'coach'
    AND (p.user_id::text = ANY(
      SELECT jsonb_array_elements_text(
        COALESCE((auth.jwt() -> 'app_metadata' -> 'admin_users')::jsonb, '[]'::jsonb)
      )
    ))
  )
);

-- 2. Secure Exercises Table
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Coach can manage their own exercises
CREATE POLICY "exercises_coach_all" 
ON public.exercises 
FOR ALL 
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- Athletes can view exercises that are in their accessible programs
CREATE POLICY "exercises_athlete_select" 
ON public.exercises 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM workout_plan_items wpi
    JOIN program_items pi ON pi.workout_id = wpi.workout_id
    JOIN program_access pa ON pa.program_id = pi.program_id
    WHERE wpi.item_type = 'exercise'
    AND wpi.item_id = exercises.id
    AND pa.user_id = auth.uid()
    AND (pa.expires_at IS NULL OR pa.expires_at > now())
  )
);

-- 3. Secure Auth Monitoring Tables
ALTER TABLE public.auth_failed_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_suspicious_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_otp_tracking ENABLE ROW LEVEL SECURITY;

-- Only admin coaches can access auth monitoring data
CREATE POLICY "auth_failed_attempts_admin_only" 
ON public.auth_failed_attempts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'coach'
    AND (p.user_id::text = ANY(
      SELECT jsonb_array_elements_text(
        COALESCE((auth.jwt() -> 'app_metadata' -> 'admin_users')::jsonb, '[]'::jsonb)
      )
    ))
  )
);

CREATE POLICY "auth_suspicious_activity_admin_only" 
ON public.auth_suspicious_activity 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'coach'
    AND (p.user_id::text = ANY(
      SELECT jsonb_array_elements_text(
        COALESCE((auth.jwt() -> 'app_metadata' -> 'admin_users')::jsonb, '[]'::jsonb)
      )
    ))
  )
);

CREATE POLICY "auth_otp_tracking_admin_only" 
ON public.auth_otp_tracking 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'coach'
    AND (p.user_id::text = ANY(
      SELECT jsonb_array_elements_text(
        COALESCE((auth.jwt() -> 'app_metadata' -> 'admin_users')::jsonb, '[]'::jsonb)
      )
    ))
  )
);

-- 4. Secure Payments Log
ALTER TABLE public.payments_log ENABLE ROW LEVEL SECURITY;

-- Only coaches can see payments for their own programs, or admin coaches can see all
CREATE POLICY "payments_log_coach_own_programs" 
ON public.payments_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.programs p 
    WHERE p.id = payments_log.program_id 
    AND p.coach_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'coach'
    AND (p.user_id::text = ANY(
      SELECT jsonb_array_elements_text(
        COALESCE((auth.jwt() -> 'app_metadata' -> 'admin_users')::jsonb, '[]'::jsonb)
      )
    ))
  )
);

-- Users can see their own payment logs
CREATE POLICY "payments_log_user_own" 
ON public.payments_log 
FOR SELECT 
USING (user_id = auth.uid());

-- 5. Fix Database Function Security - Add proper search paths
CREATE OR REPLACE FUNCTION public.get_current_user_role()
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

CREATE OR REPLACE FUNCTION public.get_current_user_role_cached()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT COALESCE(role::text, 'athlete') 
  INTO user_role
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(user_role, 'athlete');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_coach_cached()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT get_current_user_role_cached() = 'coach';
$$;

CREATE OR REPLACE FUNCTION public.is_athlete()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT get_current_user_role() = 'athlete';
$$;