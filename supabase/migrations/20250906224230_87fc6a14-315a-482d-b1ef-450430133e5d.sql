-- Fix the workouts RLS policy to use the correct function
DROP POLICY IF EXISTS "workouts_athlete_select" ON public.workouts;

CREATE POLICY "workouts_athlete_select" 
ON public.workouts 
FOR SELECT 
USING (can_access_workout_fast(id));