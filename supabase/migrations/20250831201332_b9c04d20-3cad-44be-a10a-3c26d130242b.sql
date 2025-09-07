-- Create workouts table
CREATE TABLE public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID,
  title TEXT NOT NULL,
  short_description TEXT,
  long_description TEXT,
  cover_image_url TEXT,
  video_url TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_plan_items table
CREATE TABLE public.workout_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('exercise', 'block', 'rest', 'info')),
  item_id UUID, -- references exercise_id or block_id when applicable
  content TEXT, -- for rest duration or info content
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_items ENABLE ROW LEVEL SECURITY;

-- Create policies for workouts
CREATE POLICY "Coaches can manage their own workouts" 
ON public.workouts 
FOR ALL 
USING ((coach_id = auth.uid()) OR (coach_id IS NULL));

-- Create policies for workout_plan_items
CREATE POLICY "Coaches can manage their own workout plan items" 
ON public.workout_plan_items 
FOR ALL 
USING (EXISTS ( SELECT 1
   FROM workouts
  WHERE ((workouts.id = workout_plan_items.workout_id) AND ((workouts.coach_id = auth.uid()) OR (workouts.coach_id IS NULL)))));

-- Create trigger for updated_at
CREATE TRIGGER update_workouts_updated_at
BEFORE UPDATE ON public.workouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_plan_items_updated_at
BEFORE UPDATE ON public.workout_plan_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();