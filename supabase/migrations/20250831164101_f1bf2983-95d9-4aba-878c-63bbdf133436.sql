-- Remove restrictive RLS policies and allow everyone to access categories
DROP POLICY IF EXISTS "Coaches can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Coaches can create their own categories" ON public.categories;
DROP POLICY IF EXISTS "Coaches can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Coaches can delete their own categories" ON public.categories;

DROP POLICY IF EXISTS "Coaches can view their own child categories" ON public.child_categories;
DROP POLICY IF EXISTS "Coaches can create their own child categories" ON public.child_categories;
DROP POLICY IF EXISTS "Coaches can update their own child categories" ON public.child_categories;
DROP POLICY IF EXISTS "Coaches can delete their own child categories" ON public.child_categories;

-- Make coach_id nullable since we don't require authentication
ALTER TABLE public.categories ALTER COLUMN coach_id DROP NOT NULL;
ALTER TABLE public.child_categories ALTER COLUMN coach_id DROP NOT NULL;

-- Create permissive policies that allow everyone to access data
CREATE POLICY "Anyone can view categories" ON public.categories
FOR SELECT USING (true);

CREATE POLICY "Anyone can create categories" ON public.categories
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update categories" ON public.categories
FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete categories" ON public.categories
FOR DELETE USING (true);

CREATE POLICY "Anyone can view child categories" ON public.child_categories
FOR SELECT USING (true);

CREATE POLICY "Anyone can create child categories" ON public.child_categories
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update child categories" ON public.child_categories
FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete child categories" ON public.child_categories
FOR DELETE USING (true);