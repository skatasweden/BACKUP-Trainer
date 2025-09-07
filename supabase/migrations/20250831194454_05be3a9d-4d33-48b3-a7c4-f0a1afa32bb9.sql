-- Create blocks table
CREATE TABLE public.blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rounds INTEGER DEFAULT 1,
  coach_id UUID,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create block_variants table
CREATE TABLE public.block_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  variant_label TEXT NOT NULL, -- A, B, C, etc.
  name TEXT, -- Optional custom name for variant
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(block_id, variant_label)
);

-- Create block_items table (exercise + protocol pairs within a variant)
CREATE TABLE public.block_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID NOT NULL REFERENCES public.block_variants(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  protocol_id UUID NOT NULL REFERENCES public.protocols(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session_schedule table (which variant to use per session)
CREATE TABLE public.session_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  variant_label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(block_id, session_number)
);

-- Enable RLS
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for blocks
CREATE POLICY "Coaches can manage their own blocks" 
ON public.blocks 
FOR ALL 
USING ((coach_id = auth.uid()) OR (coach_id IS NULL));

-- Create RLS policies for block_variants
CREATE POLICY "Coaches can manage their own block variants" 
ON public.block_variants 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.blocks 
    WHERE blocks.id = block_variants.block_id 
    AND (blocks.coach_id = auth.uid() OR blocks.coach_id IS NULL)
  )
);

-- Create RLS policies for block_items
CREATE POLICY "Coaches can manage their own block items" 
ON public.block_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.block_variants bv
    JOIN public.blocks b ON b.id = bv.block_id
    WHERE bv.id = block_items.variant_id 
    AND (b.coach_id = auth.uid() OR b.coach_id IS NULL)
  )
);

-- Create RLS policies for session_schedules
CREATE POLICY "Coaches can manage their own session schedules" 
ON public.session_schedules 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.blocks 
    WHERE blocks.id = session_schedules.block_id 
    AND (blocks.coach_id = auth.uid() OR blocks.coach_id IS NULL)
  )
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_blocks_updated_at
BEFORE UPDATE ON public.blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_block_variants_updated_at
BEFORE UPDATE ON public.block_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_block_items_updated_at
BEFORE UPDATE ON public.block_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_session_schedules_updated_at
BEFORE UPDATE ON public.session_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();