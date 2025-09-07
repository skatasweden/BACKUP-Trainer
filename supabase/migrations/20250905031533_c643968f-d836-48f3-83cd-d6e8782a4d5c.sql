-- Drop all existing RLS policies first
DROP POLICY IF EXISTS "admin_audit_log_coach_select" ON public.admin_audit_log;
DROP POLICY IF EXISTS "admin_audit_log_system_insert" ON public.admin_audit_log;
DROP POLICY IF EXISTS "block_items_select" ON public.block_items;
DROP POLICY IF EXISTS "coach_crud_items_via_block" ON public.block_items;
DROP POLICY IF EXISTS "block_variants_select" ON public.block_variants;
DROP POLICY IF EXISTS "coach_crud_variants_via_block" ON public.block_variants;
DROP POLICY IF EXISTS "blocks_select" ON public.blocks;
DROP POLICY IF EXISTS "coach_crud_own_blocks" ON public.blocks;
DROP POLICY IF EXISTS "categories_mut" ON public.categories;
DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "child_categories_mut" ON public.child_categories;
DROP POLICY IF EXISTS "child_categories_select" ON public.child_categories;
DROP POLICY IF EXISTS "exercises_delete_coach" ON public.exercises;
DROP POLICY IF EXISTS "exercises_insert_coach" ON public.exercises;
DROP POLICY IF EXISTS "exercises_select" ON public.exercises;
DROP POLICY IF EXISTS "exercises_update_coach" ON public.exercises;
DROP POLICY IF EXISTS "profiles_consolidated_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_full_access_mutations" ON public.profiles;
DROP POLICY IF EXISTS "pa_delete_by_coach" ON public.program_access;
DROP POLICY IF EXISTS "pa_insert_assigned_by_coach" ON public.program_access;
DROP POLICY IF EXISTS "pa_insert_purchased_service" ON public.program_access;
DROP POLICY IF EXISTS "pa_select_user_or_owner" ON public.program_access;
DROP POLICY IF EXISTS "pa_update_by_coach" ON public.program_access;
DROP POLICY IF EXISTS "program_items_delete_coach" ON public.program_items;
DROP POLICY IF EXISTS "program_items_insert_coach" ON public.program_items;
DROP POLICY IF EXISTS "program_items_select" ON public.program_items;
DROP POLICY IF EXISTS "program_items_update_coach" ON public.program_items;
DROP POLICY IF EXISTS "coach_crud_own_programs" ON public.programs;
DROP POLICY IF EXISTS "programs_select" ON public.programs;
DROP POLICY IF EXISTS "coach_crud_own_protocols" ON public.protocols;
DROP POLICY IF EXISTS "protocols_select" ON public.protocols;
DROP POLICY IF EXISTS "session_schedules_coach_manage" ON public.session_schedules;
DROP POLICY IF EXISTS "workout_plan_items_coach_manage" ON public.workout_plan_items;
DROP POLICY IF EXISTS "coach_crud_own_workouts" ON public.workouts;
DROP POLICY IF EXISTS "workouts_select" ON public.workouts;

-- Create centralized security functions for consistent role checking
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(role::text, 'athlete') 
  FROM public.profiles 
  WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_current_user_role() = 'coach';
$$;

CREATE OR REPLACE FUNCTION public.is_athlete()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_current_user_role() = 'athlete';
$$;

-- Function to check if user has program access (cached approach)
CREATE OR REPLACE FUNCTION public.has_program_access(program_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.program_access pa 
    WHERE pa.program_id = program_id_param 
      AND pa.user_id = get_current_user_id()
      AND (pa.expires_at IS NULL OR pa.expires_at > now())
  );
$$;

-- Function to check if user owns a program
CREATE OR REPLACE FUNCTION public.owns_program(program_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = program_id_param 
      AND p.coach_id = get_current_user_id()
  );
$$;

-- Function to check if user can access workout (either owns it or has program access)
CREATE OR REPLACE FUNCTION public.can_access_workout(workout_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workouts w
    WHERE w.id = workout_id_param 
      AND w.coach_id = get_current_user_id()
  ) OR EXISTS (
    SELECT 1 FROM public.program_items pi
    JOIN public.program_access pa ON pa.program_id = pi.program_id
    WHERE pi.workout_id = workout_id_param
      AND pa.user_id = get_current_user_id()
      AND (pa.expires_at IS NULL OR pa.expires_at > now())
  );
$$;

-- Simple policies using the new functions

-- Profiles: Users see own profile, coaches see all
CREATE POLICY "profiles_policy" ON public.profiles
FOR ALL USING (
  user_id = get_current_user_id() OR is_coach()
);

-- Programs: Coaches manage own, athletes see accessible ones
CREATE POLICY "programs_coach_policy" ON public.programs
FOR ALL USING (
  coach_id = get_current_user_id()
);

CREATE POLICY "programs_athlete_policy" ON public.programs
FOR SELECT USING (
  has_program_access(id)
);

-- Program Access: Coaches manage for their programs, users see their own
CREATE POLICY "program_access_coach_policy" ON public.program_access
FOR ALL USING (
  owns_program(program_id)
);

CREATE POLICY "program_access_user_policy" ON public.program_access
FOR SELECT USING (
  user_id = get_current_user_id()
);

CREATE POLICY "program_access_purchase_policy" ON public.program_access
FOR INSERT WITH CHECK (
  access_type = 'purchased' AND user_id = get_current_user_id()
);

-- Program Items: Coaches manage, athletes with access can view
CREATE POLICY "program_items_coach_policy" ON public.program_items
FOR ALL USING (
  is_coach() AND owns_program(program_id)
);

CREATE POLICY "program_items_athlete_policy" ON public.program_items
FOR SELECT USING (
  has_program_access(program_id)
);

-- Workouts: Coaches manage own, athletes access via programs
CREATE POLICY "workouts_coach_policy" ON public.workouts
FOR ALL USING (
  coach_id = get_current_user_id()
);

CREATE POLICY "workouts_athlete_policy" ON public.workouts
FOR SELECT USING (
  can_access_workout(id)
);

-- Workout Plan Items: Coaches manage
CREATE POLICY "workout_plan_items_policy" ON public.workout_plan_items
FOR ALL USING (
  is_coach() AND EXISTS (
    SELECT 1 FROM public.workouts w
    WHERE w.id = workout_plan_items.workout_id 
      AND w.coach_id = get_current_user_id()
  )
);

-- Blocks: Coaches manage own, athletes access via workouts
CREATE POLICY "blocks_coach_policy" ON public.blocks
FOR ALL USING (
  coach_id = get_current_user_id()
);

CREATE POLICY "blocks_athlete_policy" ON public.blocks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workout_plan_items wpi
    JOIN public.workouts w ON w.id = wpi.workout_id
    WHERE wpi.item_id = blocks.id 
      AND wpi.item_type = 'block'
      AND can_access_workout(w.id)
  )
);

-- Block Variants: Follow block access
CREATE POLICY "block_variants_coach_policy" ON public.block_variants
FOR ALL USING (
  is_coach() AND EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE b.id = block_variants.block_id 
      AND b.coach_id = get_current_user_id()
  )
);

CREATE POLICY "block_variants_athlete_policy" ON public.block_variants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workout_plan_items wpi
    JOIN public.workouts w ON w.id = wpi.workout_id
    WHERE wpi.item_id = block_variants.block_id 
      AND wpi.item_type = 'block'
      AND can_access_workout(w.id)
  )
);

-- Block Items: Follow block variant access
CREATE POLICY "block_items_coach_policy" ON public.block_items
FOR ALL USING (
  is_coach() AND EXISTS (
    SELECT 1 FROM public.block_variants bv
    JOIN public.blocks b ON b.id = bv.block_id
    WHERE bv.id = block_items.variant_id 
      AND b.coach_id = get_current_user_id()
  )
);

CREATE POLICY "block_items_athlete_policy" ON public.block_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.block_variants bv
    JOIN public.workout_plan_items wpi ON wpi.item_id = bv.block_id
    JOIN public.workouts w ON w.id = wpi.workout_id
    WHERE bv.id = block_items.variant_id 
      AND wpi.item_type = 'block'
      AND can_access_workout(w.id)
  )
);

-- Exercises: Coaches manage own, athletes access via blocks
CREATE POLICY "exercises_coach_policy" ON public.exercises
FOR ALL USING (
  coach_id = get_current_user_id()
);

CREATE POLICY "exercises_athlete_policy" ON public.exercises
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.block_items bi
    JOIN public.block_variants bv ON bv.id = bi.variant_id
    JOIN public.workout_plan_items wpi ON wpi.item_id = bv.block_id
    JOIN public.workouts w ON w.id = wpi.workout_id
    WHERE bi.exercise_id = exercises.id 
      AND wpi.item_type = 'block'
      AND can_access_workout(w.id)
  )
);

-- Protocols: Coaches manage own, athletes access via exercises
CREATE POLICY "protocols_coach_policy" ON public.protocols
FOR ALL USING (
  coach_id = get_current_user_id()
);

CREATE POLICY "protocols_athlete_policy" ON public.protocols
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.block_items bi
    JOIN public.block_variants bv ON bv.id = bi.variant_id
    JOIN public.workout_plan_items wpi ON wpi.item_id = bv.block_id
    JOIN public.workouts w ON w.id = wpi.workout_id
    WHERE bi.protocol_id = protocols.id 
      AND wpi.item_type = 'block'
      AND can_access_workout(w.id)
  )
);

-- Categories: Coach only
CREATE POLICY "categories_policy" ON public.categories
FOR ALL USING (
  coach_id = get_current_user_id() OR is_coach()
);

-- Child Categories: Coach only
CREATE POLICY "child_categories_policy" ON public.child_categories
FOR ALL USING (
  coach_id = get_current_user_id() OR is_coach()
);

-- Session Schedules: Coaches only
CREATE POLICY "session_schedules_policy" ON public.session_schedules
FOR ALL USING (
  is_coach() AND EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE b.id = session_schedules.block_id 
      AND b.coach_id = get_current_user_id()
  )
);

-- Admin Audit Log: Coaches only
CREATE POLICY "admin_audit_log_policy" ON public.admin_audit_log
FOR SELECT USING (is_coach());

CREATE POLICY "admin_audit_log_insert_policy" ON public.admin_audit_log
FOR INSERT WITH CHECK (true); -- System inserts