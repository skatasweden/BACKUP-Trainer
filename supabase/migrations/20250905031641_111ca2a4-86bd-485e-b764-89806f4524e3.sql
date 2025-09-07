-- Create performance indexes for the new RLS architecture
CREATE INDEX IF NOT EXISTS idx_programs_coach_id ON public.programs(coach_id) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_workouts_coach_id ON public.workouts(coach_id) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_exercises_coach_id ON public.exercises(coach_id) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_protocols_coach_id ON public.protocols(coach_id);
CREATE INDEX IF NOT EXISTS idx_blocks_coach_id ON public.blocks(coach_id) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_categories_coach_id ON public.categories(coach_id) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_child_categories_coach_id ON public.child_categories(coach_id) WHERE NOT is_archived;

-- Critical indexes for program access performance
CREATE INDEX IF NOT EXISTS idx_program_access_user_program ON public.program_access(user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_program_access_expires_at ON public.program_access(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_program_access_active ON public.program_access(user_id) WHERE expires_at IS NULL OR expires_at > now();

-- Performance indexes for profile and role checking
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON public.profiles(user_id, role);

-- Workout plan items for quick access
CREATE INDEX IF NOT EXISTS idx_workout_plan_items_type ON public.workout_plan_items(workout_id, item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_program_items_workout ON public.program_items(program_id, workout_id);

-- Block structure indexes
CREATE INDEX IF NOT EXISTS idx_block_variants_block ON public.block_variants(block_id);
CREATE INDEX IF NOT EXISTS idx_block_items_variant ON public.block_items(variant_id, exercise_id, protocol_id);

-- Clean up legacy functions that might conflict
DROP FUNCTION IF EXISTS public.current_user_role();
DROP FUNCTION IF EXISTS public.current_user_id();
DROP FUNCTION IF EXISTS public.user_has_program_access(UUID);
DROP FUNCTION IF EXISTS public.can_user_access_program(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.is_admin();

-- Update existing functions to use consistent naming
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_coach();
$$;