import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useUploadWorkoutImage() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      if (!file) throw new Error("No file provided");

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('workout-images')
        .upload(fileName, file, {
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('workout-images')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    },
    onSuccess: () => {
      toast({
        title: "Bild uppladdad",
        description: "Träningspassets omslagsbild har laddats upp",
      });
    },
    onError: (error) => {
      toast({
        title: "Uppladdning misslyckades",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}