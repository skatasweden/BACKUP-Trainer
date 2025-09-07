import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Category {
  id: string;
  coach_id: string | null;
  name: string;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChildCategory {
  id: string;
  category_id: string;
  coach_id: string | null;
  name: string;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useChildCategories(categoryId?: string) {
  return useQuery({
    queryKey: ['child_categories', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      
      const { data, error } = await supabase
        .from('child_categories')
        .select('*')
        .eq('category_id', categoryId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as ChildCategory[];
    },
    enabled: !!categoryId,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; sort_order: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: result, error } = await supabase
        .from('categories')
        .insert({
          coach_id: user.id,
          name: data.name,
          sort_order: data.sort_order,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Kategori skapad",
        description: "Den nya kategorin har skapats framgångsrikt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte skapa kategorin. Försök igen.",
        variant: "destructive",
      });
    },
  });
}

export function useCreateChildCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { category_id: string; name: string; sort_order: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: result, error } = await supabase
        .from('child_categories')
        .insert({
          category_id: data.category_id,
          coach_id: user.id,
          name: data.name,
          sort_order: data.sort_order,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['child_categories', variables.category_id] });
      toast({
        title: "Praktikenhet skapad",
        description: "Den nya praktikenheten har skapats framgångsrikt.",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte skapa praktikenheten. Försök igen.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { id: string; name?: string; sort_order?: number; is_archived?: boolean }) => {
      const { data: result, error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Kategori uppdaterad",
        description: "Kategorin har uppdaterats framgångsrikt.",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera kategorin. Försök igen.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateChildCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { id: string; category_id: string; name?: string; sort_order?: number; is_archived?: boolean }) => {
      const { data: result, error } = await supabase
        .from('child_categories')
        .update(data)
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['child_categories', variables.category_id] });
      toast({
        title: "Praktikenhet uppdaterad",
        description: "Praktikenheten har uppdaterats framgångsrikt.",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera praktikenheten. Försök igen.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCategoriesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categories: Array<{ id: string; sort_order: number }>) => {
      const updates = categories.map(cat => 
        supabase
          .from('categories')
          .update({ sort_order: cat.sort_order })
          .eq('id', cat.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error('Failed to update category order');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateChildCategoriesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { categoryId: string; childCategories: Array<{ id: string; sort_order: number }> }) => {
      const updates = data.childCategories.map(child => 
        supabase
          .from('child_categories')
          .update({ sort_order: child.sort_order })
          .eq('id', child.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error('Failed to update child category order');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['child_categories', variables.categoryId] });
    },
  });
}