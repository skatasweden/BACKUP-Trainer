-- Update protocols SELECT policy to allow both coach ownership and athlete access
DROP POLICY IF EXISTS "protocols_select_policy" ON public.protocols;

CREATE POLICY "protocols_select_policy" ON public.protocols
FOR SELECT 
TO authenticated
USING ((coach_id = get_current_user_id()) OR can_access_protocol(id));