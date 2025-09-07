-- Fix workout plan items to point to correct blocks instead of protocols
UPDATE workout_plan_items 
SET item_id = '5440b061-0c1f-4e0f-932e-259731eba638' 
WHERE id = 'c9624382-ad5d-4233-8c5b-6cd6ce8f4fe2' 
AND workout_id = '3afd3ddb-1d54-4011-b197-5d0cd4fe6454';

UPDATE workout_plan_items 
SET item_id = 'b1619ff9-3d80-4693-af8a-6576a7fdbc9a' 
WHERE id = 'd1e63289-31e9-404c-a3d9-18533e1fd5f4' 
AND workout_id = '3afd3ddb-1d54-4011-b197-5d0cd4fe6454';