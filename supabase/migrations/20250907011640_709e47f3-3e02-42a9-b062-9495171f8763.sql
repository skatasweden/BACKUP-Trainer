-- Fix get_workout_with_details to properly return program_item data
-- Debug version with comprehensive logging

CREATE OR REPLACE FUNCTION public.get_workout_with_details(
  workout_id_param uuid, 
  user_id_param uuid DEFAULT NULL::uuid,
  program_id_param uuid DEFAULT NULL::uuid
)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  uid uuid := coalesce(user_id_param, auth.uid());
  has_access boolean;
  payload json;
  target_program_id uuid;
  debug_info text;
begin
  -- Require auth
  if uid is null then
    return json_build_object('error','UNAUTHORIZED_ACCESS', 'debug', 'No user ID');
  end if;

  -- Prevent impersonation
  if user_id_param is not null and user_id_param <> auth.uid() then
    return json_build_object('error','UNAUTHORIZED_ACCESS', 'debug', 'Impersonation attempt');
  end if;

  -- Determine target program_id with debug info
  if program_id_param is not null then
    target_program_id := program_id_param;
    debug_info := 'Using provided program_id: ' || program_id_param::text;
  else
    -- Fallback: get the first accessible program for this workout
    select pi.program_id into target_program_id
    from public.program_items pi
    join public.program_access pa on pa.program_id = pi.program_id
    where pi.workout_id = workout_id_param
      and pa.user_id = uid
      and (pa.expires_at is null or pa.expires_at > now())
    order by pa.created_at desc
    limit 1;
    
    debug_info := 'Found fallback program_id: ' || coalesce(target_program_id::text, 'NULL');
  end if;

  -- Check access: coach owner or athlete via program_access
  select
    exists (
      select 1
      from public.workouts w
      where w.id = workout_id_param
        and w.coach_id = uid
    )
    or
    exists (
      select 1
      from public.program_items pi
      join public.program_access pa on pa.program_id = pi.program_id
      where pi.workout_id = workout_id_param
        and pa.user_id = uid
        and (pa.expires_at is null or pa.expires_at > now())
        and (target_program_id is null or pi.program_id = target_program_id)
    )
  into has_access;

  if not has_access then
    return json_build_object(
      'error','UNAUTHORIZED_ACCESS', 
      'debug', 'No access to workout. target_program_id: ' || coalesce(target_program_id::text, 'NULL')
    );
  end if;

  -- Build JSON response with specific program context
  select json_build_object(
           'workout', row_to_json(w),
           'plan_items', coalesce(pi_json.items, '[]'::json),
           'program_item', pr_json.obj,
           'debug_info', json_build_object(
             'target_program_id', target_program_id,
             'debug_message', debug_info,
             'workout_id', workout_id_param,
             'user_id', uid
           )
         )
    into payload
  from public.workouts w
  left join lateral (
    select json_agg(
             json_build_object(
               'id', wpi.id,
               'item_type', wpi.item_type,
               'item_id', wpi.item_id,
               'content', wpi.content,
               'sort_order', wpi.sort_order,
               'exercise',
                 case when wpi.item_type = 'exercise'
                      then json_build_object(
                             'id', e.id,
                             'title', e.title,
                             'short_description', e.short_description,
                             'long_description', e.long_description,
                             'cover_image_url', e.cover_image_url,
                             'youtube_url', e.youtube_url
                           )
                      else null end,
               'block',
                 case when wpi.item_type = 'block'
                      then json_build_object(
                             'id', b.id,
                             'name', b.name,
                             'description', b.description,
                             'rounds', b.rounds,
                             'variants', coalesce((
                               select json_agg(
                                        json_build_object(
                                          'id', bv.id,
                                          'variant_label', bv.variant_label,
                                          'items', coalesce((
                                            select json_agg(
                                                     json_build_object(
                                                       'sort_order', bi.sort_order,
                                                       'exercise', to_json(be),
                                                       'protocol', to_json(bp)
                                                     )
                                                     order by bi.sort_order
                                                   )
                                            from public.block_items bi
                                            join public.exercises be on be.id = bi.exercise_id
                                            left join public.protocols bp on bp.id = bi.protocol_id
                                            where bi.variant_id = bv.id
                                          ), '[]'::json)
                                        )
                                        order by bv.sort_order
                                      )
                               from public.block_variants bv
                               where bv.block_id = b.id
                             ), '[]'::json)
                           )
                      else null end
             )
             order by wpi.sort_order
           ) as items
    from public.workout_plan_items wpi
    left join public.exercises e on e.id = wpi.item_id and wpi.item_type = 'exercise'
    left join public.blocks    b on b.id = wpi.item_id and wpi.item_type = 'block'
    where wpi.workout_id = w.id
  ) pi_json on true
  left join lateral (
    -- Get program_item from the specific program context - prioritize exact match
    select to_json(x) as obj
    from (
      select 
        pi.video_url, 
        pi.show_video,
        pi.program_id,
        pi.id as program_item_id,
        p.name as program_name
      from public.program_items pi
      join public.programs p on p.id = pi.program_id
      where pi.workout_id = w.id
        and (target_program_id is null or pi.program_id = target_program_id)
        and exists (
          select 1
          from public.program_access pa
          where pa.program_id = pi.program_id
            and pa.user_id = uid
            and (pa.expires_at is null or pa.expires_at > now())
        )
      order by 
        case when pi.program_id = target_program_id then 0 else 1 end,
        pi.updated_at desc,
        pi.created_at desc,
        pi.id desc
      limit 1
    ) x
  ) pr_json on true
  where w.id = workout_id_param;

  return payload;
end;
$function$;