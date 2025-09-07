-- Fix remaining function security issues

-- Fix trigger functions and other remaining functions with missing search paths
CREATE OR REPLACE FUNCTION public.set_coach_id_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.coach_id IS NULL THEN
    NEW.coach_id := auth.uid();
  END IF;
  RETURN NEW;
END 
$$;

CREATE OR REPLACE FUNCTION public.set_coach_id_on_update_if_null()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.coach_id IS NULL THEN
    NEW.coach_id := auth.uid();
  END IF;
  RETURN NEW;
END 
$$;

CREATE OR REPLACE FUNCTION public.prevent_coach_id_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.coach_id IS NULL AND NEW.coach_id IS NOT NULL THEN
    RETURN NEW; -- tillåt NULL -> satt
  END IF;
  IF NEW.coach_id IS DISTINCT FROM OLD.coach_id THEN
    RAISE EXCEPTION 'coach_id is immutable';
  END IF;
  RETURN NEW;
END 
$$;

CREATE OR REPLACE FUNCTION public.cleanup_wpi_on_protocol_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.workout_plan_items
  WHERE item_id = OLD.id
    AND (item_type IS NULL OR lower(item_type) = 'protocol');
  RETURN OLD;
END 
$$;

CREATE OR REPLACE FUNCTION public.enforce_program_access_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
begin
  insert into public.profiles (user_id, email, role)
  values (new.id, new.email, 'athlete'::public.user_role)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;