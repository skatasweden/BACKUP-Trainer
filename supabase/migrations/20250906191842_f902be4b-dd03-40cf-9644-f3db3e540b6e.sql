-- Remove admin dependencies and implement RLS policies without admin references

-- Drop functions that reference admin_audit_log
DROP FUNCTION IF EXISTS public.update_user_role(uuid, user_role);
DROP FUNCTION IF EXISTS public.update_user_password(uuid, text);

-- Ensure helper functions exist with proper security
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN (
    SELECT COALESCE(role::text, 'athlete') 
    FROM public.profiles 
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'coach'
  );
$function$;

-- Enable RLS on programs table
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- Programs policies: public read (purchasable), coach full access
DROP POLICY IF EXISTS "programs_public_read" ON public.programs;
CREATE POLICY "programs_public_read" 
ON public.programs 
FOR SELECT 
USING (is_purchasable = true AND NOT is_archived);

DROP POLICY IF EXISTS "programs_coach_policy" ON public.programs;
CREATE POLICY "programs_coach_policy" 
ON public.programs 
FOR ALL 
USING (coach_id = current_user_id())
WITH CHECK (coach_id = current_user_id());

-- Enable RLS on program_access table
ALTER TABLE public.program_access ENABLE ROW LEVEL SECURITY;

-- Program_access policies: athletes read own, coaches read/write for their programs
DROP POLICY IF EXISTS "program_access_own_read" ON public.program_access;
CREATE POLICY "program_access_own_read" 
ON public.program_access 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "program_access_coach_read" ON public.program_access;
CREATE POLICY "program_access_coach_read" 
ON public.program_access 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM programs pr
  WHERE pr.id = program_access.program_id 
    AND pr.coach_id = auth.uid()
));

DROP POLICY IF EXISTS "program_access_coach_insert" ON public.program_access;
CREATE POLICY "program_access_coach_insert" 
ON public.program_access 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM programs pr
  WHERE pr.id = program_access.program_id 
    AND pr.coach_id = auth.uid()
    AND pr.is_archived = false
));

DROP POLICY IF EXISTS "program_access_coach_update" ON public.program_access;
CREATE POLICY "program_access_coach_update" 
ON public.program_access 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM programs pr
  WHERE pr.id = program_access.program_id 
    AND pr.coach_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM programs pr
  WHERE pr.id = program_access.program_id 
    AND pr.coach_id = auth.uid()
));

DROP POLICY IF EXISTS "program_access_coach_delete" ON public.program_access;
CREATE POLICY "program_access_coach_delete" 
ON public.program_access 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM programs pr
  WHERE pr.id = program_access.program_id 
    AND pr.coach_id = auth.uid()
));

-- Create integrity trigger to prevent key changes
CREATE OR REPLACE FUNCTION public.enforce_program_access_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.program_id IS DISTINCT FROM OLD.program_id THEN
      RAISE EXCEPTION 'user_id/program_id cannot be changed after creation';
    END IF;
  END IF;

  -- Verify program is not archived
  PERFORM 1 FROM public.programs pr
   WHERE pr.id = NEW.program_id AND pr.is_archived = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Program is archived or does not exist';
  END IF;

  -- Set timestamps and coach_id
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_at IS NULL THEN NEW.created_at := now(); END IF;
    IF NEW.coach_id IS NULL THEN NEW.coach_id := auth.uid(); END IF;
  ELSE
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$function$;

-- Apply integrity trigger
DROP TRIGGER IF EXISTS enforce_program_access_integrity_trigger ON public.program_access;
CREATE TRIGGER enforce_program_access_integrity_trigger
  BEFORE INSERT OR UPDATE ON public.program_access
  FOR EACH ROW EXECUTE FUNCTION public.enforce_program_access_integrity();

-- Create unique constraint to prevent duplicate access
DROP INDEX IF EXISTS unique_program_access_per_user;
CREATE UNIQUE INDEX unique_program_access_per_user 
ON public.program_access (user_id, program_id);