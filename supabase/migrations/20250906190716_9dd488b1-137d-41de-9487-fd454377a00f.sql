-- Create missing helper functions
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID 
LANGUAGE SQL 
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  );
$$;

-- 1) PROGRAMS - Public read only for purchasable + not archived, coach owns all
DROP POLICY IF EXISTS "programs_public_read" ON public.programs;
DROP POLICY IF EXISTS "programs_owner_all" ON public.programs;
DROP POLICY IF EXISTS "programs_coach_all_policy" ON public.programs;
DROP POLICY IF EXISTS "programs_athlete_policy" ON public.programs;

CREATE POLICY "programs_public_read" ON public.programs
  FOR SELECT TO public
  USING (is_purchasable = true AND NOT is_archived);

CREATE POLICY "programs_owner_all" ON public.programs
  FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- 2) PROGRAM_ACCESS - Athlete sees own, coach sees for their programs, only service role writes
DROP POLICY IF EXISTS "program_access_own_read" ON public.program_access;
DROP POLICY IF EXISTS "program_access_coach_read" ON public.program_access;
DROP POLICY IF EXISTS "program_access_coach_policy" ON public.program_access;
DROP POLICY IF EXISTS "program_access_purchase_policy" ON public.program_access;
DROP POLICY IF EXISTS "program_access_user_policy" ON public.program_access;

CREATE POLICY "program_access_own_read" ON public.program_access
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "program_access_coach_read" ON public.program_access
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.programs pr
    WHERE pr.id = program_access.program_id
      AND pr.coach_id = auth.uid()
  ));

-- Service role handles INSERT/UPDATE/DELETE (webhooks), coaches can grant access manually
CREATE POLICY "program_access_coach_manage" ON public.program_access
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.programs pr
    WHERE pr.id = program_access.program_id
      AND pr.coach_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.programs pr
    WHERE pr.id = program_access.program_id
      AND pr.coach_id = auth.uid()
  ));

-- 3) WORKOUTS - Coach owns all, athletes read via program_access
DROP POLICY IF EXISTS "workouts_owner_all" ON public.workouts;
DROP POLICY IF EXISTS "workouts_athlete_read" ON public.workouts;
DROP POLICY IF EXISTS "workouts_coach_all_policy" ON public.workouts;
DROP POLICY IF EXISTS "workouts_athlete_select_policy" ON public.workouts;

CREATE POLICY "workouts_owner_all" ON public.workouts
  FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "workouts_athlete_read" ON public.workouts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.program_items pi
    JOIN public.program_access pa ON pa.program_id = pi.program_id
    WHERE pi.workout_id = workouts.id
      AND pa.user_id = auth.uid()
      AND (pa.expires_at IS NULL OR pa.expires_at > now())
  ));

-- 4) EXERCISES - Coach owns all, athletes read via blocks in programs they have access to
DROP POLICY IF EXISTS "exercises_owner_all" ON public.exercises;
DROP POLICY IF EXISTS "exercises_athlete_read" ON public.exercises;
DROP POLICY IF EXISTS "exercises_coach_all_policy" ON public.exercises;
DROP POLICY IF EXISTS "exercises_athlete_select_policy" ON public.exercises;

CREATE POLICY "exercises_owner_all" ON public.exercises
  FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "exercises_athlete_read" ON public.exercises
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.block_items bi
    JOIN public.block_variants bv ON bv.id = bi.variant_id
    JOIN public.blocks bl ON bl.id = bv.block_id
    JOIN public.workout_plan_items wpi ON wpi.item_id = bl.id AND wpi.item_type = 'block'
    JOIN public.workouts w ON w.id = wpi.workout_id
    JOIN public.program_items pi ON pi.workout_id = w.id
    JOIN public.program_access pa ON pa.program_id = pi.program_id
    WHERE bi.exercise_id = exercises.id
      AND pa.user_id = auth.uid()
      AND (pa.expires_at IS NULL OR pa.expires_at > now())
  ));

-- 5) BLOCKS - Coach owns all, athletes read via programs they have access to
DROP POLICY IF EXISTS "blocks_owner_all" ON public.blocks;
DROP POLICY IF EXISTS "blocks_athlete_read" ON public.blocks;
DROP POLICY IF EXISTS "blocks_coach_all_policy" ON public.blocks;
DROP POLICY IF EXISTS "blocks_athlete_select_policy" ON public.blocks;

CREATE POLICY "blocks_owner_all" ON public.blocks
  FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "blocks_athlete_read" ON public.blocks
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.workout_plan_items wpi
    JOIN public.workouts w ON w.id = wpi.workout_id
    JOIN public.program_items pi ON pi.workout_id = w.id
    JOIN public.program_access pa ON pa.program_id = pi.program_id
    WHERE wpi.item_id = blocks.id 
      AND wpi.item_type = 'block'
      AND pa.user_id = auth.uid()
      AND (pa.expires_at IS NULL OR pa.expires_at > now())
  ));

-- 6) BLOCK_VARIANTS - Coach owns via blocks, athletes read via access
DROP POLICY IF EXISTS "block_variants_owner_all" ON public.block_variants;
DROP POLICY IF EXISTS "block_variants_athlete_read" ON public.block_variants;
DROP POLICY IF EXISTS "block_variants_coach_all_policy" ON public.block_variants;
DROP POLICY IF EXISTS "block_variants_athlete_select_policy" ON public.block_variants;

CREATE POLICY "block_variants_owner_all" ON public.block_variants
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE b.id = block_variants.block_id
      AND b.coach_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE b.id = block_variants.block_id
      AND b.coach_id = auth.uid()
  ));

CREATE POLICY "block_variants_athlete_read" ON public.block_variants
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.blocks bl
    JOIN public.workout_plan_items wpi ON wpi.item_id = bl.id AND wpi.item_type = 'block'
    JOIN public.workouts w ON w.id = wpi.workout_id
    JOIN public.program_items pi ON pi.workout_id = w.id
    JOIN public.program_access pa ON pa.program_id = pi.program_id
    WHERE bl.id = block_variants.block_id
      AND pa.user_id = auth.uid()
      AND (pa.expires_at IS NULL OR pa.expires_at > now())
  ));

-- 7) BLOCK_ITEMS - Coach owns via blocks, athletes read via access
DROP POLICY IF EXISTS "block_items_owner_all" ON public.block_items;
DROP POLICY IF EXISTS "block_items_athlete_read" ON public.block_items;
DROP POLICY IF EXISTS "block_items_coach_all_policy" ON public.block_items;
DROP POLICY IF EXISTS "block_items_athlete_select_policy" ON public.block_items;

CREATE POLICY "block_items_owner_all" ON public.block_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 
    FROM public.block_variants bv
    JOIN public.blocks bl ON bl.id = bv.block_id
    WHERE bv.id = block_items.variant_id
      AND bl.coach_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 
    FROM public.block_variants bv
    JOIN public.blocks bl ON bl.id = bv.block_id
    WHERE bv.id = block_items.variant_id
      AND bl.coach_id = auth.uid()
  ));

CREATE POLICY "block_items_athlete_read" ON public.block_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.block_variants bv
    JOIN public.blocks bl ON bl.id = bv.block_id
    JOIN public.workout_plan_items wpi ON wpi.item_id = bl.id AND wpi.item_type = 'block'
    JOIN public.workouts w ON w.id = wpi.workout_id
    JOIN public.program_items pi ON pi.workout_id = w.id
    JOIN public.program_access pa ON pa.program_id = pi.program_id
    WHERE bv.id = block_items.variant_id
      AND pa.user_id = auth.uid()
      AND (pa.expires_at IS NULL OR pa.expires_at > now())
  ));

-- 8) CATEGORIES - Coach owns all
DROP POLICY IF EXISTS "categories_owner_all" ON public.categories;
DROP POLICY IF EXISTS "categories_coach_all_policy" ON public.categories;

CREATE POLICY "categories_owner_all" ON public.categories
  FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- 9) CHILD_CATEGORIES - Coach owns via parent category
DROP POLICY IF EXISTS "child_categories_owner_all" ON public.child_categories;
DROP POLICY IF EXISTS "child_categories_coach_all_policy" ON public.child_categories;

CREATE POLICY "child_categories_owner_all" ON public.child_categories
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.categories c
    WHERE c.id = child_categories.category_id
      AND c.coach_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.categories c
    WHERE c.id = child_categories.category_id
      AND c.coach_id = auth.uid()
  ));