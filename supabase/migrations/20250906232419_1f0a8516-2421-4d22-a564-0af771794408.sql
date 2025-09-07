-- Complete remaining function security fixes and other critical security issues

-- Fix remaining functions with missing search paths
CREATE OR REPLACE FUNCTION public.can_access_protocol(p_protocol_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  select exists (
    select 1
    from public.workout_plan_items wpi
    join public.workouts w       on w.id = wpi.workout_id
    join public.program_items pi on pi.workout_id = w.id
    join public.program_access pa on pa.program_id = pi.program_id
    where wpi.item_type = 'protocol'
      and wpi.item_id   = p_protocol_id
      and pa.user_id    = auth.uid()
      and (pa.expires_at is null or pa.expires_at > now())
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_workout_optimized(workout_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Direct coach ownership check first (fastest path)
  SELECT EXISTS (
    SELECT 1 FROM public.workouts w
    WHERE w.id = workout_id_param 
      AND w.coach_id = auth.uid()
  ) OR EXISTS (
    -- Optimized athlete access via single join path
    SELECT 1 FROM public.program_access pa
    JOIN public.program_items pi ON pi.program_id = pa.program_id
    WHERE pi.workout_id = workout_id_param
      AND pa.user_id = auth.uid()
      AND (pa.expires_at IS NULL OR pa.expires_at > now())
    LIMIT 1
  );
$$;

CREATE OR REPLACE FUNCTION public.refresh_athlete_workout_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.athlete_workout_access;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_workout_fast(workout_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Fast coach check first
  SELECT EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = workout_id_param 
      AND w.coach_id = auth.uid()
  ) OR EXISTS (
    -- Fast athlete check using program access
    SELECT 1 FROM program_items pi
    WHERE pi.workout_id = workout_id_param
      AND pi.program_id IN (SELECT program_id FROM get_user_accessible_programs())
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_accessible_programs()
RETURNS TABLE(program_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT pa.program_id
  FROM program_access pa
  WHERE pa.user_id = auth.uid()
    AND (pa.expires_at IS NULL OR pa.expires_at > now());
$$;

CREATE OR REPLACE FUNCTION public.get_upcoming_workouts_fast(user_id_param uuid)
RETURNS TABLE(id uuid, title text, short_description text, long_description text, cover_image_url text, video_url text, program_id uuid, program_name text, program_cover_image_url text, sort_order integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT DISTINCT
    w.id,
    w.title,
    w.short_description,
    w.long_description,
    w.cover_image_url,
    w.video_url,
    pi.program_id,
    p.name as program_name,
    p.cover_image_url as program_cover_image_url,
    pi.sort_order
  FROM workouts w
  JOIN program_items pi ON pi.workout_id = w.id
  JOIN programs p ON p.id = pi.program_id
  JOIN program_access pa ON pa.program_id = pi.program_id
  WHERE pa.user_id = user_id_param
    AND (pa.expires_at IS NULL OR pa.expires_at > now())
    AND w.is_archived = false
    AND p.is_archived = false
  ORDER BY pi.program_id, pi.sort_order;
$$;

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
select auth.uid(); 
$$;

-- Hide materialized view from API by revoking permissions
REVOKE ALL ON public.athlete_workout_access FROM anon;
REVOKE ALL ON public.athlete_workout_access FROM authenticated;

-- Move pg_trgm extension from public to extensions schema (if it exists)
-- Note: This may require manual intervention as it can't always be done automatically
DO $$
BEGIN
    -- Check if extension exists in public schema
    IF EXISTS (
        SELECT 1 FROM pg_extension e 
        JOIN pg_namespace n ON e.extnamespace = n.oid 
        WHERE e.extname = 'pg_trgm' AND n.nspname = 'public'
    ) THEN
        -- Create extensions schema if it doesn't exist
        CREATE SCHEMA IF NOT EXISTS extensions;
        
        -- Move extension to extensions schema
        ALTER EXTENSION pg_trgm SET SCHEMA extensions;
    END IF;
EXCEPTION 
    WHEN OTHERS THEN
        -- Extension move failed, log but continue
        RAISE NOTICE 'Could not move pg_trgm extension: %', SQLERRM;
END
$$;