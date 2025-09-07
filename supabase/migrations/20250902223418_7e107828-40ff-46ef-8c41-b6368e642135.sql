-- Add RLS policy for athletes to view protocols in accessible workouts
CREATE POLICY "Athletes can view protocols in accessible workouts" 
ON public.protocols 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM workout_plan_items wpi
    JOIN workouts w ON w.id = wpi.workout_id
    JOIN program_items pi ON pi.workout_id = w.id
    JOIN program_access pa ON pa.program_id = pi.program_id
    WHERE wpi.item_id = protocols.id 
    AND pa.user_id = auth.uid()
    AND (pa.expires_at IS NULL OR pa.expires_at > now())
  )
);