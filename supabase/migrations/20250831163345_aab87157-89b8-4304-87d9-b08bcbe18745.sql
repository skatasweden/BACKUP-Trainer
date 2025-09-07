-- Create categories table for main categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create child_categories table for sub-categories
CREATE TABLE public.child_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories - coaches can only access their own categories
CREATE POLICY "Coaches can view their own categories" ON public.categories
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create their own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own categories" ON public.categories
  FOR DELETE USING (auth.uid() = coach_id);

-- Create policies for child_categories - coaches can only access their own child categories
CREATE POLICY "Coaches can view their own child categories" ON public.child_categories
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create their own child categories" ON public.child_categories
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own child categories" ON public.child_categories
  FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own child categories" ON public.child_categories
  FOR DELETE USING (auth.uid() = coach_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_child_categories_updated_at
  BEFORE UPDATE ON public.child_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_categories_coach_id ON public.categories(coach_id);
CREATE INDEX idx_categories_sort_order ON public.categories(sort_order);
CREATE INDEX idx_child_categories_category_id ON public.child_categories(category_id);
CREATE INDEX idx_child_categories_coach_id ON public.child_categories(coach_id);
CREATE INDEX idx_child_categories_sort_order ON public.child_categories(sort_order);