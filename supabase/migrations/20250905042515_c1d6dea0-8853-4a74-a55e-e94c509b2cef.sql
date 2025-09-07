-- Skapa en RLS-policy för athletes att se workout_plan_items
-- för workouts de har åtkomst till via program_access
CREATE POLICY "workout_plan_items_athlete_select_policy" 
ON public.workout_plan_items 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.program_items pi
    JOIN public.program_access pa ON pa.program_id = pi.program_id
    WHERE pi.workout_id = workout_plan_items.workout_id
      AND pa.user_id = auth.uid()
      AND (pa.expires_at IS NULL OR pa.expires_at > now())
  )
);