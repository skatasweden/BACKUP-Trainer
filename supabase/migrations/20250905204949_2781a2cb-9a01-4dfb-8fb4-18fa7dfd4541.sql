-- Temporarily replace the complex INSERT policy with a simple one
DROP POLICY IF EXISTS "protocols_coach_insert_policy" ON protocols;

-- Create a simple policy that just checks if user is authenticated
CREATE POLICY "protocols_simple_insert_policy" ON protocols
FOR INSERT 
TO authenticated 
WITH CHECK (true);