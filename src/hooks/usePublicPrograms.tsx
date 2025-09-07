import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Program } from "./usePrograms";

// Hook for fetching public purchasable programs (no authentication required)
export function usePublicPrograms() {
  const programs = useQuery({
    queryKey: ["public-programs"],
    queryFn: async () => {
      // Create a new client instance without auth headers for public access
      const { data, error } = await supabase
        .from("programs")
        .select(`
          id,
          name,
          short_description,
          long_description,
          cover_image_url,
          video_url,
          price,
          currency,
          billing_interval,
          billing_interval_count,
          is_purchasable,
          created_at
        `)
        .eq("is_archived", false)
        .eq("is_purchasable", true)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching public programs:", error);
        throw error;
      }
      
      return data as Program[];
    },
  });

  return { programs };
}