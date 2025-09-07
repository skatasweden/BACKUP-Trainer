-- Drop the problematic RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "Coaches can view all athlete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can view profiles for program management" ON public.profiles;

-- Create a simpler, safer RLS policy that allows coaches to view all profiles
-- without causing recursion by avoiding complex subqueries
CREATE POLICY "Coaches can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  get_user_role() = 'coach'
);