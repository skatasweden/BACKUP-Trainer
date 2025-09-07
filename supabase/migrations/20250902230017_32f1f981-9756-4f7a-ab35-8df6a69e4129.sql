-- Drop existing restrictive athlete workout policy
DROP POLICY IF EXISTS "Athletes can view workouts from accessible programs" ON workouts;

-- Create new athlete workout policy that allows access regardless of coach_id
CREATE POLICY "Athletes can view workouts from accessible programs" ON workouts
FOR SELECT USING (
  get_user_role() = 'athlete'::text AND
  EXISTS (
    SELECT 1 FROM program_items pi
    JOIN program_access pa ON pi.program_id = pa.program_id
    WHERE pi.workout_id = workouts.id 
    AND pa.user_id = auth.uid() 
    AND (pa.expires_at IS NULL OR pa.expires_at > now())
  )
);

-- Add RLS policy for athletes to view blocks used in accessible workouts
CREATE POLICY "Athletes can view blocks in accessible workouts" ON blocks
FOR SELECT USING (
  get_user_role() = 'athlete'::text AND
  EXISTS (
    SELECT 1 FROM workout_plan_items wpi
    JOIN program_items pi ON pi.workout_id = wpi.workout_id
    JOIN program_access pa ON pa.program_id = pi.program_id
    WHERE wpi.item_id = blocks.id 
    AND wpi.item_type = 'block'
    AND pa.user_id = auth.uid() 
    AND (pa.expires_at IS NULL OR pa.expires_at > now())
  )
);

-- Add RLS policy for athletes to view block variants
CREATE POLICY "Athletes can view block variants in accessible workouts" ON block_variants
FOR SELECT USING (
  get_user_role() = 'athlete'::text AND
  EXISTS (
    SELECT 1 FROM workout_plan_items wpi
    JOIN program_items pi ON pi.workout_id = wpi.workout_id
    JOIN program_access pa ON pa.program_id = pi.program_id
    WHERE wpi.item_id = block_variants.block_id 
    AND wpi.item_type = 'block'
    AND pa.user_id = auth.uid() 
    AND (pa.expires_at IS NULL OR pa.expires_at > now())
  )
);

-- Add RLS policy for athletes to view block items
CREATE POLICY "Athletes can view block items in accessible workouts" ON block_items
FOR SELECT USING (
  get_user_role() = 'athlete'::text AND
  EXISTS (
    SELECT 1 FROM block_variants bv
    JOIN workout_plan_items wpi ON wpi.item_id = bv.block_id
    JOIN program_items pi ON pi.workout_id = wpi.workout_id
    JOIN program_access pa ON pa.program_id = pi.program_id
    WHERE bv.id = block_items.variant_id 
    AND wpi.item_type = 'block'
    AND pa.user_id = auth.uid() 
    AND (pa.expires_at IS NULL OR pa.expires_at > now())
  )
);

-- Add RLS policy for athletes to view exercises in blocks from accessible workouts
CREATE POLICY "Athletes can view exercises in accessible blocks" ON exercises
FOR SELECT USING (
  get_user_role() = 'athlete'::text AND
  EXISTS (
    SELECT 1 FROM block_items bi
    JOIN block_variants bv ON bv.id = bi.variant_id
    JOIN workout_plan_items wpi ON wpi.item_id = bv.block_id
    JOIN program_items pi ON pi.workout_id = wpi.workout_id
    JOIN program_access pa ON pa.program_id = pi.program_id
    WHERE bi.exercise_id = exercises.id 
    AND wpi.item_type = 'block'
    AND pa.user_id = auth.uid() 
    AND (pa.expires_at IS NULL OR pa.expires_at > now())
  )
);

-- Add RLS policy for athletes to view protocols in blocks from accessible workouts
CREATE POLICY "Athletes can view protocols in accessible blocks" ON protocols
FOR SELECT USING (
  get_user_role() = 'athlete'::text AND
  EXISTS (
    SELECT 1 FROM block_items bi
    JOIN block_variants bv ON bv.id = bi.variant_id
    JOIN workout_plan_items wpi ON wpi.item_id = bv.block_id
    JOIN program_items pi ON pi.workout_id = wpi.workout_id
    JOIN program_access pa ON pa.program_id = pi.program_id
    WHERE bi.protocol_id = protocols.id 
    AND wpi.item_type = 'block'
    AND pa.user_id = auth.uid() 
    AND (pa.expires_at IS NULL OR pa.expires_at > now())
  )
);