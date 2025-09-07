-- Allow coaches to view all athlete profiles so they can assign program access
CREATE POLICY "Coaches can view all athletes" 
ON public.profiles 
FOR SELECT 
USING (
  -- Coaches can see all athletes
  get_current_user_role_cached() = 'coach' AND role = 'athlete'
);