import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Program {
  id: string;
  coach_id?: string;
  name: string;
  short_description?: string;
  long_description?: string;
  cover_image_url?: string;
  video_url?: string;
  price?: number;
  currency: string;
  billing_interval: 'one_time' | 'monthly' | 'weekly' | 'daily';
  billing_interval_count: number;
  is_purchasable: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProgramAccess {
  id: string;
  user_id: string;
  program_id: string;
  access_type: 'assigned' | 'purchased';
  coach_id?: string;
  stripe_session_id?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProgramItem {
  id: string;
  program_id: string;
  workout_id: string;
  sort_order: number;
  video_url?: string;
  show_video: boolean;
  created_at: string;
  updated_at: string;
}

// Hook for coaches - shows all their programs
export function usePrograms() {
  const queryClient = useQueryClient();

  const programs = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select(`
          *,
          currency,
          billing_interval,
          billing_interval_count
        `)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Program[];
    },
  });

  const createProgram = useMutation({
    mutationFn: async (programData: Omit<Partial<Program>, 'id' | 'created_at' | 'updated_at'> & { name: string }) => {
      const { data, error } = await supabase
        .from("programs")
        .insert(programData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["athlete-programs"] });
      toast({
        title: "Program skapat",
        description: "Programmet har skapats framgångsrikt",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Det gick inte att skapa programmet",
        variant: "destructive",
      });
    },
  });

  const updateProgram = useMutation({
    mutationFn: async ({ id, ...programData }: Partial<Program> & { id: string }) => {
      const { data, error } = await supabase
        .from("programs")
        .update(programData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["athlete-programs"] });
      toast({
        title: "Program uppdaterat",
        description: "Programmet har uppdaterats framgångsrikt",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Det gick inte att uppdatera programmet",
        variant: "destructive",
      });
    },
  });

  const deleteProgram = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("programs")
        .update({ is_archived: true })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["athlete-programs"] });
      toast({
        title: "Program arkiverat",
        description: "Programmet har arkiverats",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Det gick inte att arkivera programmet",
        variant: "destructive",
      });
    },
  });

  const duplicateProgram = useMutation({
    mutationFn: async (id: string) => {
      // First get the original program
      const { data: originalProgram, error: fetchError } = await supabase
        .from("programs")
        .select("*")
        .eq("id", id)
        .single();
      
      if (fetchError) throw fetchError;

      // Create new program with duplicated data
      const { data: newProgram, error: createError } = await supabase
        .from("programs")
        .insert({
          name: `${originalProgram.name} (Kopia)`,
          short_description: originalProgram.short_description,
          long_description: originalProgram.long_description,
          cover_image_url: originalProgram.cover_image_url,
          video_url: originalProgram.video_url,
          price: originalProgram.price,
          is_purchasable: false, // Don't make copies purchasable by default
        })
        .select()
        .single();
      
      if (createError) throw createError;

      // Get and duplicate program items
      const { data: programItems, error: itemsError } = await supabase
        .from("program_items")
        .select("*")
        .eq("program_id", id)
        .order("sort_order");
      
      if (itemsError) throw itemsError;

      if (programItems && programItems.length > 0) {
        const { error: itemsInsertError } = await supabase
          .from("program_items")
          .insert(
            programItems.map(item => ({
              program_id: newProgram.id,
              workout_id: item.workout_id,
              sort_order: item.sort_order,
              video_url: item.video_url,
              show_video: item.show_video,
            }))
          );
        
        if (itemsInsertError) throw itemsInsertError;
      }

      return newProgram;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["athlete-programs"] });
      toast({
        title: "Program duplicerat",
        description: "Programmet har duplicerats framgångsrikt",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Det gick inte att duplicera programmet",
        variant: "destructive",
      });
    },
  });
  
  return {
    programs,
    createProgram,
    updateProgram,
    deleteProgram,
    duplicateProgram,
  };
}

// Hook for athletes - shows programs they have access to + purchasable programs
export function useAthletePrograms() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const programs = useQuery({
    queryKey: ["athlete-programs", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get all non-archived programs with access data
      // RLS policy will filter to show only accessible or purchasable programs
      const { data, error } = await supabase
        .from("programs")
        .select(`
          *,
          currency,
          billing_interval,
          billing_interval_count,
          program_access!left (
            access_type,
            expires_at,
            created_at
          )
        `)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Transform data to include access information
      return data.map(program => ({
        ...program,
        hasAccess: !!program.program_access?.[0],
        accessType: program.program_access?.[0]?.access_type,
        accessExpires: program.program_access?.[0]?.expires_at,
        accessGranted: program.program_access?.[0]?.created_at,
      })) as (Program & {
        hasAccess: boolean;
        accessType?: 'assigned' | 'purchased';
        accessExpires?: string;
        accessGranted?: string;
      })[];
    },
    enabled: !!user?.id,
  });

  return { programs };
}


export function useProgramItems(programId: string) {
  const queryClient = useQueryClient();

  const programItems = useQuery({
    queryKey: ["program-items", programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_items")
        .select(`
          *,
          video_url,
          show_video,
          workouts (
            id,
            title,
            short_description,
            cover_image_url
          )
        `)
        .eq("program_id", programId)
        .order("sort_order");
      
      if (error) throw error;
      return data;
    },
    enabled: !!programId,
  });

  const createProgramItem = useMutation({
    mutationFn: async (itemData: Omit<Partial<ProgramItem>, 'id' | 'created_at' | 'updated_at'> & { program_id: string; workout_id: string }) => {
      const { data, error } = await supabase
        .from("program_items")
        .insert(itemData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-items", programId] });
    },
  });

  const updateProgramItem = useMutation({
    mutationFn: async ({ id, ...itemData }: Partial<ProgramItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("program_items")
        .update(itemData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-items", programId] });
    },
  });

  const deleteProgramItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("program_items")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-items", programId] });
    },
  });

  const updateProgramItemsOrder = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const updates = items.map(item => 
        supabase
          .from("program_items")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id)
      );
      
      const results = await Promise.all(updates);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw errors[0].error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-items", programId] });
      // Also invalidate athlete workout detail queries to refresh video settings
      queryClient.invalidateQueries({ queryKey: ["athlete-workout-detail"] });
      queryClient.invalidateQueries({ queryKey: ["athlete-exercise-detail"] });
    },
  });

  return {
    programItems,
    createProgramItem,
    updateProgramItem,
    deleteProgramItem,
    updateProgramItemsOrder,
  };
}