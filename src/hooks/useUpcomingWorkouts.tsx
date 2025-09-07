import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UpcomingWorkout {
  id: string;
  title: string;
  short_description: string | null;
  long_description: string | null;
  cover_image_url: string | null;
  video_url: string | null;
  program_id: string;
  program_name: string;
  program_cover_image_url: string | null;
  sort_order: number;
}

export function useUpcomingWorkouts() {
  const { user } = useAuth();

  const upcomingWorkouts = useQuery({
    queryKey: ["upcoming-workouts", user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Use optimized database function for single query
      const { data, error } = await supabase.rpc('get_upcoming_workouts_fast', {
        user_id_param: user.id
      });

      if (error) throw error;

      // Transform to UpcomingWorkout format
      const workouts: UpcomingWorkout[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        short_description: item.short_description,
        long_description: item.long_description,
        cover_image_url: item.cover_image_url,
        video_url: item.video_url,
        program_id: item.program_id,
        program_name: item.program_name || "Okänt program",
        program_cover_image_url: item.program_cover_image_url || null,
        sort_order: item.sort_order,
      }));

      return workouts;
    },
    enabled: !!user,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });

  return {
    upcomingWorkouts,
  };
}