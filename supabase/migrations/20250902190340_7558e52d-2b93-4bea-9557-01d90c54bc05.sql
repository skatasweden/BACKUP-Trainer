-- Update RLS policy to allow coaches to delete any access for their programs
DROP POLICY IF EXISTS "Coaches can delete their assignments" ON public.program_access;

-- Create new policy that allows coaches to delete any type of access for their programs
CREATE POLICY "Coaches can delete any access for their programs" ON public.program_access
FOR DELETE
USING (
  get_user_role() = 'coach'::text 
  AND EXISTS (
    SELECT 1 FROM programs 
    WHERE programs.id = program_access.program_id 
    AND (programs.coach_id = auth.uid() OR programs.coach_id IS NULL)
  )
);