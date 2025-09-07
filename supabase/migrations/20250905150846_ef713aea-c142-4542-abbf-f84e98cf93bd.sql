-- Fix Security Issue: Restrict coach access to profiles

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;

-- Create a new secure policy that restricts coach access
CREATE POLICY "profiles_secure_policy" 
ON public.profiles 
FOR ALL 
USING (
  -- Users can always access their own profile
  user_id = get_current_user_id() 
  OR 
  -- Coaches can only access profiles of users who have access to programs they own
  (is_coach() AND EXISTS (
    SELECT 1 
    FROM program_access pa
    JOIN programs p ON p.id = pa.program_id
    WHERE pa.user_id = profiles.user_id 
      AND p.coach_id = get_current_user_id()
      AND (pa.expires_at IS NULL OR pa.expires_at > now())
  ))
);

-- Ensure the policy covers all operations with the same logic
CREATE POLICY "profiles_secure_policy_with_check" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Users can only create their own profile
  user_id = get_current_user_id()
);

-- Update policy for UPDATE operations to be more restrictive
CREATE POLICY "profiles_secure_update_policy" 
ON public.profiles 
FOR UPDATE 
USING (
  -- Users can update their own profile
  user_id = get_current_user_id() 
  OR 
  -- Coaches can update profiles of users in their programs (for admin purposes)
  (is_coach() AND EXISTS (
    SELECT 1 
    FROM program_access pa
    JOIN programs p ON p.id = pa.program_id
    WHERE pa.user_id = profiles.user_id 
      AND p.coach_id = get_current_user_id()
      AND (pa.expires_at IS NULL OR pa.expires_at > now())
  ))
)
WITH CHECK (
  -- Same restrictions for what can be updated
  user_id = get_current_user_id() 
  OR 
  (is_coach() AND EXISTS (
    SELECT 1 
    FROM program_access pa
    JOIN programs p ON p.id = pa.program_id
    WHERE pa.user_id = profiles.user_id 
      AND p.coach_id = get_current_user_id()
      AND (pa.expires_at IS NULL OR pa.expires_at > now())
  ))
);