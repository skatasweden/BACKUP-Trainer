-- Add RLS policy for athletes to view workouts from accessible programs
CREATE POLICY "Athletes can view workouts from accessible programs" 
ON workouts FOR SELECT 
USING (
  get_user_role() = 'athlete' 
  AND EXISTS (
    SELECT 1 
    FROM program_items pi 
    JOIN program_access pa ON pi.program_id = pa.program_id 
    WHERE pi.workout_id = workouts.id 
    AND pa.user_id = auth.uid()
    AND (pa.expires_at IS NULL OR pa.expires_at > now())
  )
);