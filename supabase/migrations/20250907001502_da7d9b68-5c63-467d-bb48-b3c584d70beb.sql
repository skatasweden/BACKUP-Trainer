-- Clean up all content tables to start fresh
-- Delete in reverse dependency order to avoid foreign key violations

-- Delete block items first (references exercises and protocols)
DELETE FROM public.block_items;

-- Delete block variants (references blocks)
DELETE FROM public.block_variants;

-- Delete session schedules (references blocks)
DELETE FROM public.session_schedules;

-- Delete workout plan items (references workouts)
DELETE FROM public.workout_plan_items;

-- Delete program items (references programs and workouts)
DELETE FROM public.program_items;

-- Delete program access (references programs)
DELETE FROM public.program_access;

-- Now delete the main content tables
DELETE FROM public.exercises;
DELETE FROM public.protocols;
DELETE FROM public.blocks;
DELETE FROM public.workouts;
DELETE FROM public.programs;

-- Also clean up categories if they exist
DELETE FROM public.child_categories;
DELETE FROM public.categories;