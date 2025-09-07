-- Performance optimization: Create composite indexes for common RLS patterns
-- Index for program_access lookups (most critical)
CREATE INDEX IF NOT EXISTS idx_program_access_user_program_expires 
ON program_access (user_id, program_id, expires_at);

-- Index for program_items lookups
CREATE INDEX IF NOT EXISTS idx_program_items_program_workout 
ON program_items (program_id, workout_id);

-- Index for workout_plan_items lookups
CREATE INDEX IF NOT EXISTS idx_workout_plan_items_workout_type_item 
ON workout_plan_items (workout_id, item_type, item_id);

-- Index for block relationships
CREATE INDEX IF NOT EXISTS idx_block_variants_block_id 
ON block_variants (block_id);

CREATE INDEX IF NOT EXISTS idx_block_items_variant_sort 
ON block_items (variant_id, sort_order);

-- Index for coach ownership queries
CREATE INDEX IF NOT EXISTS idx_workouts_coach_id 
ON workouts (coach_id);

CREATE INDEX IF NOT EXISTS idx_blocks_coach_id 
ON blocks (coach_id);

CREATE INDEX IF NOT EXISTS idx_exercises_coach_id 
ON exercises (coach_id);

CREATE INDEX IF NOT EXISTS idx_protocols_coach_id 
ON protocols (coach_id);

-- Create optimized security definer functions for better RLS performance
CREATE OR REPLACE FUNCTION public.get_user_accessible_programs()
RETURNS TABLE(program_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT pa.program_id
  FROM program_access pa
  WHERE pa.user_id = auth.uid()
    AND (pa.expires_at IS NULL OR pa.expires_at > now());
$$;

CREATE OR REPLACE FUNCTION public.can_access_workout_fast(workout_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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

-- Create optimized view for athlete workout access
CREATE OR REPLACE VIEW public.athlete_workout_access_fast AS
SELECT DISTINCT
  w.id as workout_id,
  w.title,
  w.short_description,
  w.long_description,
  w.cover_image_url,
  w.video_url,
  pi.program_id,
  p.name as program_name,
  p.cover_image_url as program_cover_image_url,
  pi.sort_order,
  pa.user_id
FROM workouts w
JOIN program_items pi ON pi.workout_id = w.id
JOIN programs p ON p.id = pi.program_id
JOIN program_access pa ON pa.program_id = pi.program_id
WHERE (pa.expires_at IS NULL OR pa.expires_at > now())
  AND w.is_archived = false
  AND p.is_archived = false;

-- Create function for fast upcoming workouts fetch
CREATE OR REPLACE FUNCTION public.get_upcoming_workouts_fast(user_id_param uuid)
RETURNS TABLE(
  id uuid,
  title text,
  short_description text,
  long_description text,
  cover_image_url text,
  video_url text,
  program_id uuid,
  program_name text,
  program_cover_image_url text,
  sort_order integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    awa.workout_id as id,
    awa.title,
    awa.short_description,
    awa.long_description,
    awa.cover_image_url,
    awa.video_url,
    awa.program_id,
    awa.program_name,
    awa.program_cover_image_url,
    awa.sort_order
  FROM athlete_workout_access_fast awa
  WHERE awa.user_id = user_id_param
  ORDER BY awa.program_id, awa.sort_order;
$$;