-- Clean up duplicate indexes that are truly redundant
-- These are safe performance improvements without affecting functionality

-- Drop duplicate indexes for block_items
DROP INDEX IF EXISTS idx_block_items_exercise;
DROP INDEX IF EXISTS idx_block_items_protocol; 
DROP INDEX IF EXISTS idx_block_items_variant;

-- Drop duplicate indexes for block_variants
DROP INDEX IF EXISTS idx_block_variants_block;

-- Drop duplicate indexes for program_items
DROP INDEX IF EXISTS idx_program_items_workout;

-- Drop duplicate indexes for protocols
DROP INDEX IF EXISTS idx_protocols_coach;

-- Drop duplicate indexes for workout_plan_items
DROP INDEX IF EXISTS idx_workout_plan_items_item;
DROP INDEX IF EXISTS idx_workout_plan_items_workout;