-- Remove the new complex protocol tables
DROP TABLE IF EXISTS protocol_step_group_items;
DROP TABLE IF EXISTS protocol_step_groups;
DROP TABLE IF EXISTS protocol_steps;

-- Add back the old simple columns to protocols table
ALTER TABLE protocols 
ADD COLUMN IF NOT EXISTS sets integer,
ADD COLUMN IF NOT EXISTS repetitions integer,
ADD COLUMN IF NOT EXISTS intensity_value numeric,
ADD COLUMN IF NOT EXISTS intensity_type text DEFAULT 'percentage';