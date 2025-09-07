-- Create programs table
CREATE TABLE public.programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID,
  name TEXT NOT NULL,
  short_description TEXT,
  long_description TEXT,
  cover_image_url TEXT,
  video_url TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create program_items table (for ordered list of workouts in a program)
CREATE TABLE public.program_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL,
  workout_id UUID NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for programs
CREATE POLICY "Coaches can manage their own programs" 
ON public.programs 
FOR ALL 
USING ((coach_id = auth.uid()) OR (coach_id IS NULL));

-- Create RLS policies for program_items
CREATE POLICY "Coaches can manage their own program items" 
ON public.program_items 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM programs 
  WHERE programs.id = program_items.program_id 
  AND ((programs.coach_id = auth.uid()) OR (programs.coach_id IS NULL))
));

-- Create trigger for programs updated_at
CREATE TRIGGER update_programs_updated_at
BEFORE UPDATE ON public.programs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for program_items updated_at
CREATE TRIGGER update_program_items_updated_at
BEFORE UPDATE ON public.program_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();