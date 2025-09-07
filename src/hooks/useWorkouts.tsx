import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Workout {
  id: string;
  coach_id: string | null;
  title: string;
  short_description: string | null;
  long_description: string | null;
  cover_image_url: string | null;
  video_url: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlanItem {
  id: string;
  workout_id: string;
  item_type: 'exercise' | 'block' | 'rest' | 'info';
  item_id: string | null;
  content: string | null;
  sort_order: number;
  video_url: string | null;
  show_video: boolean;
  created_at: string;
  updated_at: string;
}

export function useWorkouts() {
  const queryClient = useQueryClient();

  const workouts = useQuery({
    queryKey: ["workouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Workout[];
    },
  });

  const createWorkout = useMutation({
    mutationFn: async (workoutData: Omit<Workout, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("workouts")
        .insert(workoutData)
        .select()
        .single();
      
      if (error) throw error;
      return data as Workout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });

  const updateWorkout = useMutation({
    mutationFn: async ({ id, ...workoutData }: Partial<Workout> & { id: string }) => {
      const { data, error } = await supabase
        .from("workouts")
        .update(workoutData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Workout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });

  const deleteWorkout = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workouts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });

  return {
    workouts,
    createWorkout,
    updateWorkout,
    deleteWorkout,
  };
}

export function useWorkoutPlanItems(workoutId: string) {
  const queryClient = useQueryClient();

  const planItems = useQuery({
    queryKey: ["workout-plan-items", workoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_plan_items")
        .select("*")
        .eq("workout_id", workoutId)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as WorkoutPlanItem[];
    },
    enabled: !!workoutId,
  });

  const createPlanItem = useMutation({
    mutationFn: async (itemData: Omit<WorkoutPlanItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("workout_plan_items")
        .insert(itemData)
        .select()
        .single();
      
      if (error) throw error;
      return data as WorkoutPlanItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-plan-items", workoutId] });
    },
  });

  const updatePlanItem = useMutation({
    mutationFn: async ({ id, ...itemData }: Partial<WorkoutPlanItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("workout_plan_items")
        .update(itemData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as WorkoutPlanItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-plan-items", workoutId] });
    },
  });

  const deletePlanItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workout_plan_items")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-plan-items", workoutId] });
    },
  });

  const updatePlanItemsOrder = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const updates = items.map(item => 
        supabase
          .from("workout_plan_items")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id)
      );
      
      const results = await Promise.all(updates);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error(`Failed to update order: ${errors[0].error?.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-plan-items", workoutId] });
    },
  });

  return {
    planItems,
    createPlanItem,
    updatePlanItem,
    deletePlanItem,
    updatePlanItemsOrder,
  };
}