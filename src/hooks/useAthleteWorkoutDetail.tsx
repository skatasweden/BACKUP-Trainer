import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WorkoutDetailData {
  workout: {
    id: string;
    title: string;
    short_description: string | null;
    long_description: string | null;
    cover_image_url: string | null;
    video_url: string | null;
    is_archived: boolean;
    coach_id: string;
    created_at: string;
    updated_at: string;
  };
  plan_items: Array<{
    id: string;
    item_type: 'exercise' | 'block' | 'rest' | 'info';
    item_id: string | null;
    content: string | null;
    sort_order: number;
    exercise?: {
      id: string;
      title: string;
      short_description: string | null;
      long_description: string | null;
      cover_image_url: string | null;
      youtube_url: string | null;
    };
    block?: {
      id: string;
      name: string;
      description: string | null;
      rounds: number | null;
      variants: Array<{
        id: string;
        variant_label: string;
        items: Array<{
          sort_order: number;
          exercise: {
            id: string;
            title: string;
            short_description: string | null;
            long_description: string | null;
            cover_image_url: string | null;
            youtube_url: string | null;
          };
          protocol: {
            id: string;
            name: string;
            description: string | null;
            sets: number | null;
            repetitions: number | null;
            intensity_value: number | null;
            intensity_type: string | null;
          };
        }>;
      }>;
    };
  }>;
  program_item: {
    video_url: string | null;
    show_video: boolean;
    program_id?: string;
    program_item_id?: string;
    program_name?: string;
  } | null;
  debug_info?: {
    target_program_id: string | null;
    debug_message: string;
    workout_id: string;
    user_id: string;
  };
}

export function useAthleteWorkoutDetail(workoutId: string | undefined, programId?: string | null, sortOrder?: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["athlete-workout-detail", workoutId, programId, sortOrder, user?.id],
    queryFn: async () => {
      if (!workoutId || !user) {
        throw new Error("Missing workoutId or user");
      }

      const { data, error } = await supabase.rpc('get_workout_with_details', {
        workout_id_param: workoutId,
        user_id_param: user.id,
        program_id_param: programId || null,
        sort_order_param: sortOrder ? parseInt(sortOrder) : null
      });

      console.log('🔍 Hook RPC response:', { data, error, workoutId, programId });
      if ((data as any)?.debug_info) {
        console.log('🔍 Hook debug_info:', (data as any).debug_info);
      }
      if ((data as any)?.program_item) {
        console.log('🔍 Hook program_item found:', (data as any).program_item);
      } else {
        console.log('🔍 Hook NO program_item in response');
      }

      if (error) throw error;

      // Check for access error
      if ((data as any)?.error === 'UNAUTHORIZED_ACCESS') {
        throw new Error('UNAUTHORIZED_ACCESS');
      }

      return data as unknown as WorkoutDetailData;
    },
    enabled: !!workoutId && !!user,
    retry: false, // Don't retry on access errors
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
  });
}