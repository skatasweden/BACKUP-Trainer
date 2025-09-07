import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Exercise {
  id: string;
  title: string;
  short_description?: string;
  long_description?: string;
  cover_image_url?: string;
  youtube_url?: string;
  category_id?: string;
  child_category_id?: string;
  coach_id?: string;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  categories?: { name: string };
  child_categories?: { name: string };
}

export function useExercises(categoryId?: string, searchQuery?: string) {
  return useQuery({
    queryKey: ['exercises', categoryId, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('exercises')
        .select(`
          *,
          categories(name),
          child_categories(name)
        `)
        .order('sort_order');

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Exercise[];
    },
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exercise: Omit<Exercise, 'id' | 'created_at' | 'updated_at'>) => {
      // Get the max sort_order for the category
      let maxSortQuery = supabase
        .from('exercises')
        .select('sort_order')
        .eq('is_archived', false)
        .order('sort_order', { ascending: false })
        .limit(1);

      // Only add category filter if category_id exists
      if (exercise.category_id) {
        maxSortQuery = maxSortQuery.eq('category_id', exercise.category_id);
      }

      const { data: maxSortData } = await maxSortQuery;

      const maxSort = maxSortData?.[0]?.sort_order ?? -1;

      const { data, error } = await supabase
        .from('exercises')
        .insert([{
          ...exercise,
          sort_order: maxSort + 1,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast({
        title: "Övning skapad",
        description: "Övningen har skapats framgångsrikt",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Det gick inte att skapa övningen",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...exercise }: Partial<Exercise> & { id: string }) => {
      const { data, error } = await supabase
        .from('exercises')
        .update(exercise)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast({
        title: "Övning uppdaterad",
        description: "Övningen har uppdaterats framgångsrikt",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Det gick inte att uppdatera övningen",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateExercisesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exercises: { id: string; sort_order: number }[]) => {
      const promises = exercises.map(exercise =>
        supabase
          .from('exercises')
          .update({ sort_order: exercise.sort_order })
          .eq('id', exercise.id)
      );

      const results = await Promise.all(promises);
      
      for (const result of results) {
        if (result.error) throw result.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast({
        title: "Övning raderad",
        description: "Övningen har raderats permanent",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Det gick inte att radera övningen",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteMultipleExercises() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast({
        title: "Övningar raderade",
        description: `${ids.length} övningar har raderats permanent`,
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Det gick inte att radera övningarna",
        variant: "destructive",
      });
    },
  });
}

export function useBulkUpdateExercises() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<Exercise> }) => {
      const { error } = await supabase
        .from('exercises')
        .update(updates)
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: (_, { ids, updates }) => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      const action = updates.is_archived ? 
        (updates.is_archived ? 'arkiverade' : 'återställde') : 'uppdaterade';
      toast({
        title: "Övningar uppdaterade",
        description: `${ids.length} övningar ${action}`,
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Det gick inte att uppdatera övningarna",
        variant: "destructive",
      });
    },
  });
}

export function useUploadExerciseImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('exercise-images')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('exercise-images')
        .getPublicUrl(filePath);

      return publicUrl;
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Det gick inte att ladda upp bilden",
        variant: "destructive",
      });
    },
  });
}