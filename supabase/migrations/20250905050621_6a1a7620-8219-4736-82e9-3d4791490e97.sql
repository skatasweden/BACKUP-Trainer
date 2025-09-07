-- Remove the duplicate program_item with show_video: false
-- Keep the one with show_video: true and video_url
DELETE FROM program_items 
WHERE id = '4da36265-68d9-4d11-8342-b65c586ab1b0' 
AND program_id = '1111b76d-4621-4df0-9f50-7f38be3bd43a' 
AND workout_id = '3afd3ddb-1d54-4011-b197-5d0cd4fe6454' 
AND show_video = false;