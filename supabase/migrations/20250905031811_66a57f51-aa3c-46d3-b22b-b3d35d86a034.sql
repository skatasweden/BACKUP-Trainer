-- Clean up old functions that might cause conflicts and security issues
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.current_user_role();
DROP FUNCTION IF EXISTS public.current_user_id();
DROP FUNCTION IF EXISTS public.user_has_program_access(UUID);
DROP FUNCTION IF EXISTS public.can_user_access_program(UUID, UUID);

-- Create secure indexes for better performance on key tables
CREATE INDEX IF NOT EXISTS idx_programs_coach_id ON public.programs(coach_id) WHERE coach_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workouts_coach_id ON public.workouts(coach_id) WHERE coach_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exercises_coach_id ON public.exercises(coach_id) WHERE coach_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_protocols_coach_id ON public.protocols(coach_id) WHERE coach_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blocks_coach_id ON public.blocks(coach_id) WHERE coach_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_program_access_user_program ON public.program_access(user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_program_access_expires ON public.program_access(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON public.profiles(user_id, role);

-- Update existing functions to be more explicit about their purpose
COMMENT ON FUNCTION public.get_current_user_id() IS 'Centralized function to get current authenticated user ID';
COMMENT ON FUNCTION public.get_current_user_role() IS 'Centralized function to get current user role with fallback to athlete';
COMMENT ON FUNCTION public.is_coach() IS 'Check if current user has coach role';
COMMENT ON FUNCTION public.is_athlete() IS 'Check if current user has athlete role';
COMMENT ON FUNCTION public.has_program_access(UUID) IS 'Check if current user has access to specific program';
COMMENT ON FUNCTION public.owns_program(UUID) IS 'Check if current user owns specific program';
COMMENT ON FUNCTION public.can_access_workout(UUID) IS 'Check if current user can access specific workout';