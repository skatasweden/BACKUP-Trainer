import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExerciseDetailData {
  plan_item: {
    id: string;
    item_type: 'exercise' | 'block' | 'rest' | 'info';
    content: string | null;
    workout_id: string;
  };
  exercise?: {
    id: string;
    title: string;
    short_description: string | null;
    long_description: string | null;
    cover_image_url: string | null;
    youtube_url: string | null;
  };
  protocol?: {
    id: string;
    name: string;
    description: string | null;
    sets: number | null;
    repetitions: number | null;
    intensity_value: number | null;
    intensity_type: string | null;
  };
  current_block?: {
    id: string;
    name: string;
  };
  block_context?: {
    current_index: number;
    total_items: number;
    items: Array<{
      sort_order: number;
      exercise_id: string;
      protocol_id: string;
      exercise_title: string;
      protocol_name: string;
    }>;
  };
  navigation?: {
    has_next_exercise: boolean;
    next_exercise?: {
      exercise_id: string;
      protocol_id: string;
    };
    is_last_exercise: boolean;
    next_block?: {
      id: string;
      block_id: string;
      block_name: string;
      first_exercise: {
        exercise_id: string;
        protocol_id: string;
      };
    };
  };
  program_item?: {
    video_url: string | null;
    show_video: boolean;
  };
}

export function useAthleteExerciseDetail(
  planItemId: string | undefined,
  exerciseId?: string | null,
  protocolId?: string | null,
  programId?: string | null
) {
  return useQuery({
    queryKey: ["athlete-exercise-detail", planItemId, exerciseId, protocolId, programId],
    queryFn: async () => {
      if (!planItemId) {
        throw new Error("Missing planItemId");
      }

      // Check current session before making request
      const { data: { session } } = await supabase.auth.getSession();
      console.debug('Current session:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        planItemId,
        exerciseId,
        protocolId,
        programId 
      });

      if (!session) {
        throw new Error('NO_SESSION');
      }

      const { data, error } = await supabase.rpc('get_exercise_with_context', {
        plan_item_id_param: planItemId,
        exercise_id_param: exerciseId || null,
        protocol_id_param: protocolId || null,
        program_id_param: programId || null,
      });

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      console.debug('RPC response:', data);

      // Check for errors
      if ((data as any)?.error === 'UNAUTHORIZED_ACCESS') {
        throw new Error('UNAUTHORIZED_ACCESS');
      }
      
      if ((data as any)?.error === 'PLAN_ITEM_NOT_FOUND') {
        throw new Error('PLAN_ITEM_NOT_FOUND');
      }

      if ((data as any)?.error === 'INVALID_PARAMETERS') {
        throw new Error('INVALID_PARAMETERS');
      }

      return data as unknown as ExerciseDetailData;
    },
    enabled: !!planItemId,
    retry: (failureCount, error) => {
      // Don't retry on auth errors, but allow retry on network errors
      if (error.message === 'UNAUTHORIZED_ACCESS' || error.message === 'NO_SESSION') {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
  });
}