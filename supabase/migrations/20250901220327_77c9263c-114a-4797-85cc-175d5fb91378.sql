-- Add foreign key constraint between program_access and profiles
ALTER TABLE public.program_access 
ADD CONSTRAINT fk_program_access_user_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add RLS policy to allow coaches to view all athlete profiles
CREATE POLICY "Coaches can view all athlete profiles" 
ON public.profiles 
FOR SELECT 
USING (
  get_user_role() = 'coach' AND 
  EXISTS (
    SELECT 1 FROM public.profiles p2 
    WHERE p2.user_id = profiles.user_id AND p2.role = 'athlete'
  )
);

-- Add RLS policy to allow coaches to view all profiles for program management
CREATE POLICY "Coaches can view profiles for program management" 
ON public.profiles 
FOR SELECT 
USING (
  get_user_role() = 'coach' AND role = 'athlete'
);