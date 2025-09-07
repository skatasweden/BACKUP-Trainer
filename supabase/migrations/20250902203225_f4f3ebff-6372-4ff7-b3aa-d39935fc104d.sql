-- Create storage bucket for workout images
INSERT INTO storage.buckets (id, name, public) VALUES ('workout-images', 'workout-images', true);

-- Create RLS policies for workout images
CREATE POLICY "Coaches can upload workout images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'workout-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Coaches can update their workout images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'workout-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Coaches can delete their workout images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'workout-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view workout images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'workout-images');