-- Add video fields to program_items table
ALTER TABLE public.program_items 
ADD COLUMN video_url text,
ADD COLUMN show_video boolean NOT NULL DEFAULT false;

-- Add comment to document the new columns
COMMENT ON COLUMN public.program_items.video_url IS 'Optional YouTube URL for this specific program item instance';
COMMENT ON COLUMN public.program_items.show_video IS 'Whether to display the video for this program item';