-- Transfer all system resources to Erik Wennberg (erikwennbergare@gmail.com)
-- Correct User ID: d7f6d87d-cd36-4838-9583-dbf47a5823fb

-- Update exercises with coach_id: NULL to Erik's user_id
UPDATE exercises 
SET coach_id = 'd7f6d87d-cd36-4838-9583-dbf47a5823fb'
WHERE coach_id IS NULL;

-- Update protocols with coach_id: NULL to Erik's user_id  
UPDATE protocols 
SET coach_id = 'd7f6d87d-cd36-4838-9583-dbf47a5823fb'
WHERE coach_id IS NULL;

-- Update blocks with coach_id: NULL to Erik's user_id
UPDATE blocks 
SET coach_id = 'd7f6d87d-cd36-4838-9583-dbf47a5823fb'
WHERE coach_id IS NULL;

-- Update workouts with coach_id: NULL to Erik's user_id
UPDATE workouts 
SET coach_id = 'd7f6d87d-cd36-4838-9583-dbf47a5823fb'
WHERE coach_id IS NULL;