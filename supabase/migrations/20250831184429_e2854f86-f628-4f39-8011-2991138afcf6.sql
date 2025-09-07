-- Update protocols table to add sets configuration
ALTER TABLE public.protocols 
ADD COLUMN youtube_url TEXT,
ADD COLUMN sets INTEGER,
ADD COLUMN repetitions INTEGER,
ADD COLUMN intensity_value NUMERIC(5,2),
ADD COLUMN intensity_type TEXT CHECK (intensity_type IN ('scale', 'percentage'));

-- Update existing records to have default values
UPDATE public.protocols 
SET sets = 3, 
    repetitions = 10, 
    intensity_value = 70,
    intensity_type = 'percentage'
WHERE sets IS NULL;