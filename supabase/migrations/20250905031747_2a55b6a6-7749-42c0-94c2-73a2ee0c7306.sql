-- Create simpler performance indexes for the new RLS architecture
CREATE INDEX IF NOT EXISTS idx_programs_coach_id ON public.programs(coach_id);
CREATE INDEX IF NOT EXISTS idx_workouts_coach_id ON public.workouts(coach_id);
CREATE INDEX IF NOT EXISTS idx_exercises_coach_id ON public.exercises(coach_id);
CREATE INDEX IF NOT EXISTS idx_protocols_coach_id ON public.protocols(coach_id);
CREATE INDEX IF NOT EXISTS idx_blocks_coach_id ON public.blocks(coach_id);
CREATE INDEX IF NOT EXISTS idx_categories_coach_id ON public.categories(coach_id);
CREATE INDEX IF NOT EXISTS idx_child_categories_coach_id ON public.child_categories(coach_id);

-- Critical indexes for program access performance
CREATE INDEX IF NOT EXISTS idx_program_access_user_program ON public.program_access(user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_program_access_expires_at ON public.program_access(expires_at);
CREATE INDEX IF NOT EXISTS idx_program_access_user_id ON public.program_access(user_id);

-- Performance indexes for profile and role checking
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON public.profiles(user_id, role);

-- Workout plan items for quick access
CREATE INDEX IF NOT EXISTS idx_workout_plan_items_workout ON public.workout_plan_items(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_plan_items_item ON public.workout_plan_items(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_program_items_program ON public.program_items(program_id);
CREATE INDEX IF NOT EXISTS idx_program_items_workout ON public.program_items(workout_id);

-- Block structure indexes
CREATE INDEX IF NOT EXISTS idx_block_variants_block ON public.block_variants(block_id);
CREATE INDEX IF NOT EXISTS idx_block_items_variant ON public.block_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_block_items_exercise ON public.block_items(exercise_id);
CREATE INDEX IF NOT EXISTS idx_block_items_protocol ON public.block_items(protocol_id);