-- Fix security issue: Remove the security definer view and use function approach
DROP VIEW IF EXISTS public.athlete_workout_access_fast;

-- Update the function to handle all the logic without a view
CREATE OR REPLACE FUNCTION public.get_upcoming_workouts_fast(user_id_param uuid)
RETURNS TABLE(
  id uuid,
  title text,
  short_description text,
  long_description text,
  cover_image_url text,
  video_url text,
  program_id uuid,
  program_name text,
  program_cover_image_url text,
  sort_order integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT
    w.id,
    w.title,
    w.short_description,
    w.long_description,
    w.cover_image_url,
    w.video_url,
    pi.program_id,
    p.name as program_name,
    p.cover_image_url as program_cover_image_url,
    pi.sort_order
  FROM workouts w
  JOIN program_items pi ON pi.workout_id = w.id
  JOIN programs p ON p.id = pi.program_id
  JOIN program_access pa ON pa.program_id = pi.program_id
  WHERE pa.user_id = user_id_param
    AND (pa.expires_at IS NULL OR pa.expires_at > now())
    AND w.is_archived = false
    AND p.is_archived = false
  ORDER BY pi.program_id, pi.sort_order;
$$;

-- Create function for complete workout details (for AthleteWorkoutDetail optimization)
CREATE OR REPLACE FUNCTION public.get_workout_with_details(workout_id_param uuid, user_id_param uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  -- Check access first
  IF NOT can_access_workout_fast(workout_id_param) THEN
    RETURN json_build_object('error', 'UNAUTHORIZED_ACCESS');
  END IF;

  -- Get all data in one query
  SELECT json_build_object(
    'workout', row_to_json(w),
    'plan_items', COALESCE(
      json_agg(
        json_build_object(
          'id', wpi.id,
          'item_type', wpi.item_type,
          'item_id', wpi.item_id,
          'content', wpi.content,
          'sort_order', wpi.sort_order,
          'exercise', CASE 
            WHEN wpi.item_type = 'exercise' AND e.id IS NOT NULL THEN
              json_build_object(
                'id', e.id,
                'title', e.title,
                'short_description', e.short_description,
                'long_description', e.long_description,
                'cover_image_url', e.cover_image_url,
                'youtube_url', e.youtube_url
              )
            ELSE NULL
          END,
          'block', CASE 
            WHEN wpi.item_type = 'block' AND b.id IS NOT NULL THEN
              json_build_object(
                'id', b.id,
                'name', b.name,
                'description', b.description,
                'rounds', b.rounds,
                'variants', COALESCE(
                  (
                    SELECT json_agg(
                      json_build_object(
                        'id', bv.id,
                        'variant_label', bv.variant_label,
                        'items', COALESCE(
                          (
                            SELECT json_agg(
                              json_build_object(
                                'sort_order', bi.sort_order,
                                'exercise', json_build_object(
                                  'id', be.id,
                                  'title', be.title,
                                  'short_description', be.short_description,
                                  'long_description', be.long_description,
                                  'cover_image_url', be.cover_image_url,
                                  'youtube_url', be.youtube_url
                                ),
                                'protocol', json_build_object(
                                  'id', bp.id,
                                  'name', bp.name,
                                  'description', bp.description,
                                  'sets', bp.sets,
                                  'repetitions', bp.repetitions,
                                  'intensity_value', bp.intensity_value,
                                  'intensity_type', bp.intensity_type
                                )
                              ) ORDER BY bi.sort_order
                            )
                            FROM block_items bi
                            JOIN exercises be ON be.id = bi.exercise_id
                            JOIN protocols bp ON bp.id = bi.protocol_id
                            WHERE bi.variant_id = bv.id
                          ), '[]'::json
                        )
                      ) ORDER BY bv.sort_order
                    )
                    FROM block_variants bv
                    WHERE bv.block_id = b.id
                  ), '[]'::json
                )
              )
            ELSE NULL
          END
        ) ORDER BY wpi.sort_order
      ) FILTER (WHERE wpi.id IS NOT NULL), '[]'::json
    ),
    'program_item', COALESCE(
      (
        SELECT json_build_object(
          'video_url', pi.video_url,
          'show_video', pi.show_video
        )
        FROM program_items pi
        WHERE pi.workout_id = workout_id_param
        LIMIT 1
      ), null
    )
  ) INTO result
  FROM workouts w
  LEFT JOIN workout_plan_items wpi ON wpi.workout_id = w.id
  LEFT JOIN exercises e ON e.id = wpi.item_id AND wpi.item_type = 'exercise'
  LEFT JOIN blocks b ON b.id = wpi.item_id AND wpi.item_type = 'block'
  WHERE w.id = workout_id_param
  GROUP BY w.id, w.title, w.short_description, w.long_description, w.cover_image_url, w.video_url, w.is_archived, w.coach_id, w.created_at, w.updated_at;

  RETURN result;
END;
$$;

-- Create function for exercise details (for AthleteExerciseDetail optimization)
CREATE OR REPLACE FUNCTION public.get_exercise_with_context(
  plan_item_id_param uuid,
  exercise_id_param uuid DEFAULT NULL,
  protocol_id_param uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
        'workout_id', plan_item_data.workout_id
      ),
      'exercise', CASE WHEN e.id IS NOT NULL THEN
        json_build_object(
          'id', e.id,
          'title', e.title,
          'short_description', e.short_description,
          'long_description', e.long_description,
          'cover_image_url', e.cover_image_url,
          'youtube_url', e.youtube_url
        ) ELSE NULL END
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
        'workout_id', plan_item_data.workout_id
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
$$;