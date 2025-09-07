-- Update workout plan items to point to existing protocols
UPDATE workout_plan_items 
SET item_id = '0118fc3d-1dc8-408f-a5d9-6f6dc6d17346' 
WHERE id = 'c9624382-ad5d-4233-8c5b-6cd6ce8f4fe2' 
AND workout_id = '3afd3ddb-1d54-4011-b197-5d0cd4fe6454';

UPDATE workout_plan_items 
SET item_id = 'fd9f6310-9092-469d-b8ec-609e8f20ff17' 
WHERE id = 'd1e63289-31e9-404c-a3d9-18533e1fd5f4' 
AND workout_id = '3afd3ddb-1d54-4011-b197-5d0cd4fe6454';