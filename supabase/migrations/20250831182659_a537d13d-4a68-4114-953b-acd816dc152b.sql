-- Disable Row Level Security on all tables
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies
DROP POLICY IF EXISTS "Anyone can create categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can update categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;

DROP POLICY IF EXISTS "Anyone can create child categories" ON public.child_categories;
DROP POLICY IF EXISTS "Anyone can delete child categories" ON public.child_categories;
DROP POLICY IF EXISTS "Anyone can update child categories" ON public.child_categories;
DROP POLICY IF EXISTS "Anyone can view child categories" ON public.child_categories;

DROP POLICY IF EXISTS "Anyone can create exercises" ON public.exercises;
DROP POLICY IF EXISTS "Anyone can delete exercises" ON public.exercises;
DROP POLICY IF EXISTS "Anyone can update exercises" ON public.exercises;
DROP POLICY IF EXISTS "Anyone can view exercises" ON public.exercises;