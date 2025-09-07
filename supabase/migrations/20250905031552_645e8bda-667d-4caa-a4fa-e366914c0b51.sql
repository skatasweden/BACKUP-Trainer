-- Enable RLS on all tables that don't have it
ALTER TABLE public.auth_failed_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_otp_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_suspicious_activity ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for auth tables (coaches only access for monitoring)
CREATE POLICY "auth_tables_coach_only" ON public.auth_failed_attempts
FOR ALL USING (is_coach());

CREATE POLICY "auth_otp_coach_only" ON public.auth_otp_tracking
FOR ALL USING (is_coach());

CREATE POLICY "auth_suspicious_coach_only" ON public.auth_suspicious_activity
FOR ALL USING (is_coach());

-- Create secure indexes for better performance
CREATE INDEX IF NOT EXISTS idx_programs_coach_id ON public.programs(coach_id);
CREATE INDEX IF NOT EXISTS idx_workouts_coach_id ON public.workouts(coach_id);
CREATE INDEX IF NOT EXISTS idx_exercises_coach_id ON public.exercises(coach_id);
CREATE INDEX IF NOT EXISTS idx_protocols_coach_id ON public.protocols(coach_id);
CREATE INDEX IF NOT EXISTS idx_blocks_coach_id ON public.blocks(coach_id);
CREATE INDEX IF NOT EXISTS idx_categories_coach_id ON public.categories(coach_id);
CREATE INDEX IF NOT EXISTS idx_child_categories_coach_id ON public.child_categories(coach_id);
CREATE INDEX IF NOT EXISTS idx_program_access_user_id ON public.program_access(user_id);
CREATE INDEX IF NOT EXISTS idx_program_access_program_id ON public.program_access(program_id);
CREATE INDEX IF NOT EXISTS idx_program_access_expires_at ON public.program_access(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update some functions to be more secure and consistent
DROP FUNCTION IF EXISTS public.current_user_role();
DROP FUNCTION IF EXISTS public.current_user_id();
DROP FUNCTION IF EXISTS public.user_has_program_access(UUID);
DROP FUNCTION IF EXISTS public.can_user_access_program(UUID, UUID);

-- Clean up old functions that might cause conflicts
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.is_admin();