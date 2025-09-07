-- Helper functions (without SECURITY DEFINER and no admin)
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID 
LANGUAGE SQL 
STABLE
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'coach'
  );
$$;

-- Remove is_admin() function completely
DROP FUNCTION IF EXISTS public.is_admin();

-- Ensure RLS is enabled on all tables
ALTER TABLE public.programs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_access     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_variants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_categories   ENABLE ROW LEVEL SECURITY;

-- 1) PROGRAMS - Public read + coach owner ALL
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

-- 2) PROGRAM_ACCESS - Athlete/coach SELECT + coach WRITE
DROP POLICY IF EXISTS "program_access_own_read" ON public.program_access;
DROP POLICY IF EXISTS "program_access_coach_read" ON public.program_access;
DROP POLICY IF EXISTS "program_access_coach_policy" ON public.program_access;
DROP POLICY IF EXISTS "program_access_purchase_policy" ON public.program_access;
DROP POLICY IF EXISTS "program_access_user_policy" ON public.program_access;
DROP POLICY IF EXISTS "program_access_coach_manage" ON public.program_access;
DROP POLICY IF EXISTS "program_access_coach_insert" ON public.program_access;
DROP POLICY IF EXISTS "program_access_coach_update" ON public.program_access;
DROP POLICY IF EXISTS "program_access_coach_delete" ON public.program_access;

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

-- Coach WRITE policies for program_access
CREATE POLICY "program_access_coach_insert" ON public.program_access
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.programs pr
    WHERE pr.id = program_access.program_id
      AND pr.coach_id = auth.uid()
      AND pr.is_archived = false
  ));

CREATE POLICY "program_access_coach_update" ON public.program_access
  FOR UPDATE TO authenticated
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

CREATE POLICY "program_access_coach_delete" ON public.program_access
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.programs pr
    WHERE pr.id = program_access.program_id
      AND pr.coach_id = auth.uid()
  ));

-- Integrity trigger for program_access
CREATE OR REPLACE FUNCTION public.enforce_program_access_integrity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.program_id IS DISTINCT FROM OLD.program_id THEN
      RAISE EXCEPTION 'user_id/program_id cannot be changed after creation';
    END IF;
  END IF;

  PERFORM 1 FROM public.programs pr
   WHERE pr.id = NEW.program_id AND pr.is_archived = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Program is archived or does not exist';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.created_at IS NULL THEN NEW.created_at := now(); END IF;
    IF NEW.coach_id IS NULL THEN NEW.coach_id := auth.uid(); END IF;
  ELSE
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_program_access_integrity ON public.program_access;
CREATE TRIGGER trg_program_access_integrity
  BEFORE INSERT OR UPDATE ON public.program_access
  FOR EACH ROW EXECUTE FUNCTION public.enforce_program_access_integrity();

-- Unique constraint for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS ux_program_access_user_prog
  ON public.program_access (user_id, program_id);