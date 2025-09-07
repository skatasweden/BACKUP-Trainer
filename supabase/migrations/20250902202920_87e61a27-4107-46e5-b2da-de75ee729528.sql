-- Transfer all system resources to Erik Wennberg (erikwennbergare@gmail.com)
-- User ID: 1307b5ee-0441-487f-81cc-e0a3e21272a5

-- Update exercises with coach_id: NULL to Erik's user_id
UPDATE exercises 
SET coach_id = '1307b5ee-0441-487f-81cc-e0a3e21272a5'
WHERE coach_id IS NULL;

-- Update protocols with coach_id: NULL to Erik's user_id  
UPDATE protocols 
SET coach_id = '1307b5ee-0441-487f-81cc-e0a3e21272a5'
WHERE coach_id IS NULL;

-- Update blocks with coach_id: NULL to Erik's user_id
UPDATE blocks 
SET coach_id = '1307b5ee-0441-487f-81cc-e0a3e21272a5'
WHERE coach_id IS NULL;

-- Update workouts with coach_id: NULL to Erik's user_id
UPDATE workouts 
SET coach_id = '1307b5ee-0441-487f-81cc-e0a3e21272a5'
WHERE coach_id IS NULL;