-- Create storage bucket for exercise images
INSERT INTO storage.buckets (id, name, public) VALUES ('exercise-images', 'exercise-images', true);

-- Create storage policies for exercise images
CREATE POLICY "Exercise images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'exercise-images');

CREATE POLICY "Coaches can upload exercise images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'exercise-images');

CREATE POLICY "Coaches can update their exercise images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'exercise-images');

CREATE POLICY "Coaches can delete their exercise images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'exercise-images');

-- Create exercises table
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  short_description TEXT,
  long_description TEXT,
  cover_image_url TEXT,
  youtube_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  child_category_id UUID REFERENCES public.child_categories(id) ON DELETE SET NULL,
  coach_id UUID,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Create policies for exercises
CREATE POLICY "Anyone can view exercises" 
ON public.exercises 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create exercises" 
ON public.exercises 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update exercises" 
ON public.exercises 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete exercises" 
ON public.exercises 
FOR DELETE 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_exercises_updated_at
BEFORE UPDATE ON public.exercises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_exercises_category_id ON public.exercises(category_id);
CREATE INDEX idx_exercises_child_category_id ON public.exercises(child_category_id);
CREATE INDEX idx_exercises_sort_order ON public.exercises(sort_order);
CREATE INDEX idx_exercises_is_archived ON public.exercises(is_archived);