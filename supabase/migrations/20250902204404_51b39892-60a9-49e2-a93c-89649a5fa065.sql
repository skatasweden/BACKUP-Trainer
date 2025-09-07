-- Create storage bucket for workout images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('workout-images', 'workout-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for workout images
CREATE POLICY "Anyone can view workout images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'workout-images');

CREATE POLICY "Authenticated users can upload workout images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'workout-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own workout images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'workout-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own workout images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'workout-images' AND auth.uid() IS NOT NULL);