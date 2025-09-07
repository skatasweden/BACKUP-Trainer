-- Fix all remaining RLS policies that might cause recursion

-- Fix workout_plan_items policies
DROP POLICY IF EXISTS "wpi_athlete_select" ON public.workout_plan_items;

CREATE POLICY "wpi_athlete_select" 
ON public.workout_plan_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM program_items pi
    JOIN program_access pa ON pa.program_id = pi.program_id
    WHERE pi.workout_id = workout_plan_items.workout_id
      AND pa.user_id = auth.uid()
      AND (pa.expires_at IS NULL OR pa.expires_at > now())
  )
);

-- Remove the old can_access_workout function that's causing recursion
DROP FUNCTION IF EXISTS public.can_access_workout(uuid);
DROP FUNCTION IF EXISTS public.can_access_workout_optimized(uuid);