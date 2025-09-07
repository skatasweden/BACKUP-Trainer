-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_categories ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Create basic policies for categories (coach can manage their own)
CREATE POLICY "Coaches can manage their own categories" ON public.categories
  FOR ALL USING (coach_id = auth.uid() OR coach_id IS NULL);

-- Create basic policies for child_categories
CREATE POLICY "Coaches can manage their own child categories" ON public.child_categories  
  FOR ALL USING (coach_id = auth.uid() OR coach_id IS NULL);

-- Create basic policies for exercises
CREATE POLICY "Coaches can manage their own exercises" ON public.exercises
  FOR ALL USING (coach_id = auth.uid() OR coach_id IS NULL);