-- Add pricing and purchasability to programs
ALTER TABLE public.programs 
ADD COLUMN price DECIMAL(10,2),
ADD COLUMN is_purchasable BOOLEAN DEFAULT false;

-- Create program_access table to track both assignments and purchases
CREATE TABLE public.program_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL CHECK (access_type IN ('assigned', 'purchased')),
  coach_id UUID, -- Only for assigned access
  stripe_session_id TEXT, -- Only for purchased access
  expires_at TIMESTAMPTZ, -- Optional expiration
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure one access record per user per program
  UNIQUE(user_id, program_id)
);

-- Enable RLS on program_access
ALTER TABLE public.program_access ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check program access
CREATE OR REPLACE FUNCTION public.can_user_access_program(check_user_id UUID, check_program_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.program_access 
    WHERE user_id = check_user_id 
    AND program_id = check_program_id
    AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- Update programs RLS policy to allow access for assigned/purchased programs
DROP POLICY IF EXISTS "Coaches can manage their own programs" ON public.programs;

CREATE POLICY "Coaches can manage their own programs" 
ON public.programs 
FOR ALL 
USING (
  (coach_id = auth.uid() AND get_user_role() = 'coach') 
  OR (coach_id IS NULL AND get_user_role() = 'coach')
);

CREATE POLICY "Athletes can view accessible programs" 
ON public.programs 
FOR SELECT 
USING (
  get_user_role() = 'athlete' 
  AND (
    -- Can access assigned/purchased programs
    can_user_access_program(auth.uid(), id)
    -- Or can view purchasable programs (for browsing)
    OR is_purchasable = true
  )
);

-- RLS policies for program_access table
CREATE POLICY "Users can view their own program access" 
ON public.program_access 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Coaches can view access for their programs" 
ON public.program_access 
FOR SELECT 
USING (
  get_user_role() = 'coach' 
  AND EXISTS (
    SELECT 1 FROM public.programs 
    WHERE id = program_id 
    AND (coach_id = auth.uid() OR coach_id IS NULL)
  )
);

CREATE POLICY "Coaches can assign their programs" 
ON public.program_access 
FOR INSERT 
WITH CHECK (
  get_user_role() = 'coach' 
  AND access_type = 'assigned'
  AND coach_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.programs 
    WHERE id = program_id 
    AND (coach_id = auth.uid() OR coach_id IS NULL)
  )
);

CREATE POLICY "Edge functions can create purchase access" 
ON public.program_access 
FOR INSERT 
WITH CHECK (access_type = 'purchased');

CREATE POLICY "Coaches can update their assignments" 
ON public.program_access 
FOR UPDATE 
USING (
  get_user_role() = 'coach' 
  AND access_type = 'assigned'
  AND coach_id = auth.uid()
);

CREATE POLICY "Coaches can delete their assignments" 
ON public.program_access 
FOR DELETE 
USING (
  get_user_role() = 'coach' 
  AND access_type = 'assigned'
  AND coach_id = auth.uid()
);

-- Create indexes for performance
CREATE INDEX idx_program_access_user_program ON public.program_access(user_id, program_id);
CREATE INDEX idx_program_access_program_id ON public.program_access(program_id);
CREATE INDEX idx_program_access_expires_at ON public.program_access(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_programs_purchasable ON public.programs(is_purchasable) WHERE is_purchasable = true;

-- Create trigger for updated_at
CREATE TRIGGER update_program_access_updated_at
  BEFORE UPDATE ON public.program_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();