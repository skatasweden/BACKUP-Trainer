-- Clean up duplicate program_items
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY program_id, workout_id ORDER BY created_at) as rn
  FROM public.program_items 
  WHERE workout_id = '3afd3ddb-1d54-4011-b197-5d0cd4fe6454'
    AND program_id = '1111b76d-4621-4df0-9f50-7f38be3bd43a'
)
DELETE FROM public.program_items 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);