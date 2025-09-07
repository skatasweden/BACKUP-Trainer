-- Add foreign key constraint for program_items to workouts
ALTER TABLE program_items 
ADD CONSTRAINT fk_program_items_workout 
FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE;