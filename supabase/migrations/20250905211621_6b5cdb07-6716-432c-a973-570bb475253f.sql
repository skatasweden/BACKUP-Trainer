-- Step 1: Create trigger function to automatically set coach_id
CREATE OR REPLACE FUNCTION public.set_coach_id_on_protocols()
RETURNS TRIGGER AS $$
BEGIN
  NEW.coach_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger that runs before INSERT
CREATE TRIGGER set_coach_id_trigger
  BEFORE INSERT ON public.protocols
  FOR EACH ROW
  EXECUTE FUNCTION public.set_coach_id_on_protocols();

-- Step 2: Remove all existing RLS policies on protocols
DROP POLICY IF EXISTS "protocols_select_policy" ON public.protocols;
DROP POLICY IF EXISTS "protocols_update_policy" ON public.protocols;
DROP POLICY IF EXISTS "protocols_delete_policy" ON public.protocols;
DROP POLICY IF EXISTS "protocols_simple_insert_policy" ON public.protocols;
DROP POLICY IF EXISTS "protocols_coach_insert_policy" ON public.protocols;

-- Step 3: Create new, simple RLS policies
-- INSERT: Only coaches can create protocols
CREATE POLICY "protocols_insert_policy" ON public.protocols
FOR INSERT 
TO authenticated
WITH CHECK (is_coach());

-- SELECT: Users can only see their own protocols
CREATE POLICY "protocols_select_policy" ON public.protocols
FOR SELECT 
TO authenticated
USING (coach_id = get_current_user_id());

-- UPDATE: Users can only update their own protocols  
CREATE POLICY "protocols_update_policy" ON public.protocols
FOR UPDATE 
TO authenticated
USING (coach_id = get_current_user_id())
WITH CHECK (coach_id = get_current_user_id());

-- DELETE: Users can only delete their own protocols
CREATE POLICY "protocols_delete_policy" ON public.protocols
FOR DELETE 
TO authenticated
USING (coach_id = get_current_user_id());