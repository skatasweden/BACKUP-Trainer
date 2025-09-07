-- CRITICAL SECURITY FIX: Properly secure the profiles table
-- The current RLS policies are not working correctly

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Deny access to unauthenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Restrict service_role access" ON public.profiles;

-- Create a comprehensive and secure RLS policy structure
-- Policy 1: Users can only view their own profile
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Users can only insert their own profile 
CREATE POLICY "Users can insert own profile only" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can only update their own profile
CREATE POLICY "Users can update own profile only" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can only delete their own profile
CREATE POLICY "Users can delete own profile only" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policy 5: Coaches can view profiles of their athletes (if needed for coach functionality)
CREATE POLICY "Coaches can view athlete profiles" 
ON public.profiles 
FOR SELECT 
USING (
  get_user_role() = 'coach' AND 
  EXISTS (
    SELECT 1 FROM public.program_access pa
    JOIN public.programs p ON p.id = pa.program_id
    WHERE pa.user_id = profiles.user_id 
    AND (p.coach_id = auth.uid() OR p.coach_id IS NULL)
  )
);

-- Ensure RLS is enabled (it should already be, but let's make sure)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;