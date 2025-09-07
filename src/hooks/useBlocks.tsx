import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface Block {
  id: string;
  name: string;
  description?: string;
  rounds: number;
  coach_id?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  variant_count?: number;
}

export interface BlockVariant {
  id: string;
  block_id: string;
  variant_label: string;
  name?: string;
  notes?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlockItem {
  id: string;
  variant_id: string;
  exercise_id: string;
  protocol_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  exercise?: {
    id: string;
    title: string;
    cover_image_url?: string;
  };
  protocol?: {
    id: string;
    name: string;
    sets?: number;
    repetitions?: number;
  };
}

export interface SessionSchedule {
  id: string;
  block_id: string;
  session_number: number;
  variant_label: string;
  created_at: string;
  updated_at: string;
}

// Hook for fetching all blocks
export function useBlocks(searchQuery?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const blocks = useQuery({
    queryKey: ["blocks", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("blocks")
        .select(`
          *,
          block_variants(count)
        `)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data.map(block => ({
        ...block,
        variant_count: block.block_variants?.[0]?.count || 0
      }));
    },
  });

  const createBlock = useMutation({
    mutationFn: async (blockData: Omit<Block, "id" | "created_at" | "updated_at" | "is_archived">) => {
      const { data, error } = await supabase
        .from("blocks")
        .insert({
          ...blockData,
          coach_id: null, // Set to null for now, can be updated when auth is implemented
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create default variant A
      const { error: variantError } = await supabase
        .from("block_variants")
        .insert({
          block_id: data.id,
          variant_label: "A",
          name: "Variant A",
          sort_order: 0,
        });
      
      if (variantError) throw variantError;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
      toast({
        title: "Block skapat",
        description: "Ditt nya block har skapats framgångsrikt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte skapa block. Försök igen.",
        variant: "destructive",
      });
    },
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blocks")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
      toast({
        title: "Block borttaget",
        description: "Blocket har tagits bort permanent.",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort block. Försök igen.",
        variant: "destructive",
      });
    },
  });

  return {
    blocks,
    createBlock,
    deleteBlock,
  };
}

// Hook for fetching a single block
export function useBlock(id: string) {
  return useQuery({
    queryKey: ["block", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocks")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// Hook for deleting a block
export function useDeleteBlock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blocks")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
      toast({
        title: "Block borttaget",
        description: "Blocket har tagits bort permanent.",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort block. Försök igen.",
        variant: "destructive",
      });
    },
  });
}

// Hook for updating a block
export function useUpdateBlock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...blockData }: Partial<Block> & { id: string }) => {
      const { data, error } = await supabase
        .from("blocks")
        .update(blockData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
      queryClient.invalidateQueries({ queryKey: ["block", data.id] });
      toast({
        title: "Block uppdaterat",
        description: "Dina ändringar har sparats.",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte spara ändringar. Försök igen.",
        variant: "destructive",
      });
    },
  });
}

// Hook for managing block variants
export function useBlockVariants(blockId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const variants = useQuery({
    queryKey: ["block-variants", blockId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("block_variants")
        .select("*")
        .eq("block_id", blockId)
        .order("sort_order");
      
      if (error) throw error;
      return data;
    },
    enabled: !!blockId,
  });

  const createVariant = useMutation({
    mutationFn: async (variantData: Omit<BlockVariant, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("block_variants")
        .insert(variantData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["block-variants", blockId] });
      toast({
        title: "Variant skapad",
        description: "Ny variant har lagts till.",
      });
    },
  });

  const updateVariant = useMutation({
    mutationFn: async ({ id, ...variantData }: Partial<BlockVariant> & { id: string }) => {
      const { data, error } = await supabase
        .from("block_variants")
        .update(variantData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["block-variants", blockId] });
    },
  });

  const deleteVariant = useMutation({
    mutationFn: async (variantId: string) => {
      const { error } = await supabase
        .from("block_variants")
        .delete()
        .eq("id", variantId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["block-variants", blockId] });
      toast({
        title: "Variant borttagen",
        description: "Varianten har tagits bort.",
      });
    },
  });

  return {
    variants,
    createVariant,
    updateVariant,
    deleteVariant,
  };
}

// Hook for managing block items within a variant
export function useBlockItems(variantId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const items = useQuery({
    queryKey: ["block-items", variantId],
    queryFn: async () => {
      // First, get block items
      const { data: blockItems, error: itemsError } = await supabase
        .from("block_items")
        .select("*")
        .eq("variant_id", variantId)
        .order("sort_order");
      
      if (itemsError) throw itemsError;
      if (!blockItems || blockItems.length === 0) return [];

      // Get unique exercise and protocol IDs
      const exerciseIds = [...new Set(blockItems.map(item => item.exercise_id).filter(Boolean))];
      const protocolIds = [...new Set(blockItems.map(item => item.protocol_id).filter(Boolean))];

      // Fetch exercises and protocols separately
      const [exercisesResult, protocolsResult] = await Promise.all([
        exerciseIds.length > 0 
          ? supabase.from("exercises").select("id, title, cover_image_url").in("id", exerciseIds)
          : { data: [], error: null },
        protocolIds.length > 0 
          ? supabase.from("protocols").select("id, name, sets, repetitions").in("id", protocolIds)
          : { data: [], error: null }
      ]);

      if (exercisesResult.error) throw exercisesResult.error;
      if (protocolsResult.error) throw protocolsResult.error;

      // Create lookup maps
      const exercisesMap = new Map<string, any>(exercisesResult.data?.map(ex => [ex.id, ex] as [string, any]) || []);
      const protocolsMap = new Map<string, any>(protocolsResult.data?.map(pr => [pr.id, pr] as [string, any]) || []);

      // Combine data
      return blockItems.map(item => ({
        ...item,
        exercise: item.exercise_id ? exercisesMap.get(item.exercise_id) || null : null,
        protocol: item.protocol_id ? protocolsMap.get(item.protocol_id) || null : null,
      }));
    },
    enabled: !!variantId,
  });

  const addItem = useMutation({
    mutationFn: async (itemData: Omit<BlockItem, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("block_items")
        .insert(itemData)
        .select("*")
        .single();
      
      if (error) throw error;
      
      // Fetch related exercise or protocol data separately
      let exercise = null;
      let protocol = null;
      
      if (data.exercise_id) {
        const { data: exerciseData } = await supabase
          .from("exercises")
          .select("id, title, cover_image_url")
          .eq("id", data.exercise_id)
          .single();
        exercise = exerciseData;
      }
      
      if (data.protocol_id) {
        const { data: protocolData } = await supabase
          .from("protocols")
          .select("id, name, sets, repetitions")
          .eq("id", data.protocol_id)
          .single();
        protocol = protocolData;
      }
      
      return { ...data, exercise, protocol };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["block-items", variantId] });
      toast({
        title: "Övning tillagd",
        description: "Övningen har lagts till i blocket.",
      });
    },
  });

  const updateItems = useMutation({
    mutationFn: async (items: Array<{ id: string; sort_order: number }>) => {
      // Update each item individually for now
      for (const item of items) {
        const { error } = await supabase
          .from("block_items")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["block-items", variantId] });
    },
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("block_items")
        .delete()
        .eq("id", itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["block-items", variantId] });
      toast({
        title: "Övning borttagen",
        description: "Övningen har tagits bort från blocket.",
      });
    },
  });

  return {
    items,
    addItem,
    updateItems,
    removeItem,
  };
}

// Hook for managing session schedules
export function useSessionSchedule(blockId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const schedule = useQuery({
    queryKey: ["session-schedule", blockId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_schedules")
        .select("*")
        .eq("block_id", blockId)
        .order("session_number");
      
      if (error) throw error;
      return data;
    },
    enabled: !!blockId,
  });

  const updateSchedule = useMutation({
    mutationFn: async (scheduleData: Array<{ session_number: number; variant_label: string }>) => {
      // First, delete existing schedule
      await supabase
        .from("session_schedules")
        .delete()
        .eq("block_id", blockId);

      // Then insert new schedule
      const { error } = await supabase
        .from("session_schedules")
        .insert(
          scheduleData.map(item => ({
            block_id: blockId,
            session_number: item.session_number,
            variant_label: item.variant_label,
          }))
        );
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-schedule", blockId] });
      toast({
        title: "Schema uppdaterat",
        description: "Pass-schemat har sparats.",
      });
    },
  });

  return {
    schedule,
    updateSchedule,
  };
}