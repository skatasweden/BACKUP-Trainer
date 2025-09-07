-- Add video settings columns to workout_plan_items
ALTER TABLE public.workout_plan_items 
ADD COLUMN video_url text,
ADD COLUMN show_video boolean NOT NULL DEFAULT false;

-- Migrate existing video settings from program_items to workout_plan_items
-- This copies video settings to all plan items in workouts that have video settings
UPDATE public.workout_plan_items wpi
SET 
  video_url = pi.video_url,
  show_video = pi.show_video
FROM public.program_items pi
WHERE pi.workout_id = wpi.workout_id
  AND pi.video_url IS NOT NULL
  AND pi.show_video = true;

-- Update get_exercise_with_context function to use workout_plan_items video settings
CREATE OR REPLACE FUNCTION public.get_exercise_with_context(
  plan_item_id_param uuid, 
  exercise_id_param uuid DEFAULT NULL::uuid, 
  protocol_id_param uuid DEFAULT NULL::uuid,
  program_id_param uuid DEFAULT NULL::uuid
)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result json;
  plan_item_data record;
BEGIN
  -- Get plan item first
  SELECT * INTO plan_item_data
  FROM workout_plan_items wpi
  WHERE wpi.id = plan_item_id_param;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'PLAN_ITEM_NOT_FOUND');
  END IF;

  -- Check workout access
  IF NOT can_access_workout_fast(plan_item_data.workout_id) THEN
    RETURN json_build_object('error', 'UNAUTHORIZED_ACCESS');
  END IF;

  -- Build complete result based on item type
  IF plan_item_data.item_type = 'exercise' AND exercise_id_param IS NULL THEN
    -- Direct exercise case
    SELECT json_build_object(
      'plan_item', json_build_object(
        'id', plan_item_data.id,
        'item_type', plan_item_data.item_type,
        'content', plan_item_data.content,
        'workout_id', plan_item_data.workout_id,
        'video_url', plan_item_data.video_url,
        'show_video', plan_item_data.show_video
      ),
      'exercise', CASE WHEN e.id IS NOT NULL THEN
        json_build_object(
          'id', e.id,
          'title', e.title,
          'short_description', e.short_description,
          'long_description', e.long_description,
          'cover_image_url', e.cover_image_url,
          'youtube_url', e.youtube_url
        ) ELSE NULL END,
      'program_item', json_build_object(
        'video_url', plan_item_data.video_url,
        'show_video', plan_item_data.show_video
      )
    ) INTO result
    FROM exercises e
    WHERE e.id = plan_item_data.item_id;

  ELSIF plan_item_data.item_type = 'block' AND exercise_id_param IS NOT NULL AND protocol_id_param IS NOT NULL THEN
    -- Block exercise case
    SELECT json_build_object(
      'plan_item', json_build_object(
        'id', plan_item_data.id,
        'item_type', plan_item_data.item_type,
        'content', plan_item_data.content,
        'workout_id', plan_item_data.workout_id,
        'video_url', plan_item_data.video_url,
        'show_video', plan_item_data.show_video
      ),
      'exercise', json_build_object(
        'id', e.id,
        'title', e.title,
        'short_description', e.short_description,
        'long_description', e.long_description,
        'cover_image_url', e.cover_image_url,
        'youtube_url', e.youtube_url
      ),
      'protocol', json_build_object(
        'id', p.id,
        'name', p.name,
        'description', p.description,
        'sets', p.sets,
        'repetitions', p.repetitions,
        'intensity_value', p.intensity_value,
        'intensity_type', p.intensity_type
      ),
      'current_block', json_build_object(
        'id', b.id,
        'name', b.name
      ),
      'block_context', json_build_object(
        'current_index', bi_current.sort_order,
        'total_items', (
          SELECT COUNT(*)
          FROM block_items bi2
          WHERE bi2.variant_id = bv.id
        ),
        'items', COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'sort_order', bi.sort_order,
                'exercise_id', bi.exercise_id,
                'protocol_id', bi.protocol_id,
                'exercise_title', be.title,
                'protocol_name', bp.name
              ) ORDER BY bi.sort_order
            )
            FROM block_items bi
            JOIN exercises be ON be.id = bi.exercise_id
            JOIN protocols bp ON bp.id = bi.protocol_id
            WHERE bi.variant_id = bv.id
          ), '[]'::json
        )
      ),
      'navigation', json_build_object(
        'has_next_exercise', (bi_current.sort_order < (
          SELECT MAX(sort_order)
          FROM block_items
          WHERE variant_id = bv.id
        )),
        'next_exercise', CASE 
          WHEN bi_current.sort_order < (SELECT MAX(sort_order) FROM block_items WHERE variant_id = bv.id) THEN
            (
              SELECT json_build_object(
                'exercise_id', exercise_id,
                'protocol_id', protocol_id
              )
              FROM block_items
              WHERE variant_id = bv.id AND sort_order = bi_current.sort_order + 1
            )
          ELSE NULL
        END,
        'is_last_exercise', (bi_current.sort_order >= (
          SELECT MAX(sort_order)
          FROM block_items
          WHERE variant_id = bv.id
        )),
        'next_block', CASE 
          WHEN (bi_current.sort_order >= (SELECT MAX(sort_order) FROM block_items WHERE variant_id = bv.id)) THEN
            (
              SELECT json_build_object(
                'id', next_wpi.id,
                'block_id', next_b.id,
                'block_name', next_b.name,
                'first_exercise', json_build_object(
                  'exercise_id', first_bi.exercise_id,
                  'protocol_id', first_bi.protocol_id
                )
              )
              FROM workout_plan_items next_wpi
              JOIN blocks next_b ON next_b.id = next_wpi.item_id
              JOIN block_variants next_bv ON next_bv.block_id = next_b.id
              JOIN block_items first_bi ON first_bi.variant_id = next_bv.id
              WHERE next_wpi.workout_id = plan_item_data.workout_id
                AND next_wpi.sort_order > plan_item_data.sort_order
                AND next_wpi.item_type = 'block'
                AND first_bi.sort_order = (
                  SELECT MIN(sort_order)
                  FROM block_items
                  WHERE variant_id = next_bv.id
                )
              ORDER BY next_wpi.sort_order
              LIMIT 1
            )
          ELSE NULL
        END
      ),
      'program_item', json_build_object(
        'video_url', plan_item_data.video_url,
        'show_video', plan_item_data.show_video
      )
    ) INTO result
    FROM exercises e
    JOIN protocols p ON p.id = protocol_id_param
    JOIN blocks b ON b.id = plan_item_data.item_id
    JOIN block_variants bv ON bv.block_id = b.id
    JOIN block_items bi_current ON bi_current.variant_id = bv.id 
      AND bi_current.exercise_id = exercise_id_param 
      AND bi_current.protocol_id = protocol_id_param
    WHERE e.id = exercise_id_param;

  ELSE
    RETURN json_build_object('error', 'INVALID_PARAMETERS');
  END IF;

  RETURN result;
END;
$function$;