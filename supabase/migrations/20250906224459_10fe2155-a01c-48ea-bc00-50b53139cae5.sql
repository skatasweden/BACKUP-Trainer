-- Fix all remaining RLS policies that use the old can_access_workout function

-- Fix blocks policy
DROP POLICY IF EXISTS "blocks_athlete_select" ON public.blocks;
CREATE POLICY "blocks_athlete_select" 
ON public.blocks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM workout_plan_items wpi
    JOIN program_items pi ON pi.workout_id = wpi.workout_id
    JOIN program_access pa ON pa.program_id = pi.program_id
    WHERE wpi.item_type = 'block' 
      AND wpi.item_id = blocks.id 
      AND pa.user_id = auth.uid()
      AND (pa.expires_at IS NULL OR pa.expires_at > now())
  )
);

-- Fix block_variants policy  
DROP POLICY IF EXISTS "block_variants_athlete_select" ON public.block_variants;
CREATE POLICY "block_variants_athlete_select" 
ON public.block_variants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM workout_plan_items wpi
    JOIN program_items pi ON pi.workout_id = wpi.workout_id
    JOIN program_access pa ON pa.program_id = pi.program_id
    WHERE wpi.item_type = 'block' 
      AND wpi.item_id = block_variants.block_id 
      AND pa.user_id = auth.uid()
      AND (pa.expires_at IS NULL OR pa.expires_at > now())
  )
);

-- Fix block_items policy
DROP POLICY IF EXISTS "block_items_athlete_select" ON public.block_items;
CREATE POLICY "block_items_athlete_select" 
ON public.block_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM block_variants bv
    JOIN workout_plan_items wpi ON wpi.item_id = bv.block_id AND wpi.item_type = 'block'
    JOIN program_items pi ON pi.workout_id = wpi.workout_id
    JOIN program_access pa ON pa.program_id = pi.program_id
    WHERE bv.id = block_items.variant_id 
      AND pa.user_id = auth.uid()
      AND (pa.expires_at IS NULL OR pa.expires_at > now())
  )
);