import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProtocols() {
  const queryClient = useQueryClient();

  const protocols = useQuery({
    queryKey: ["protocols"],
    queryFn: async () => {
      console.log("🔍 useProtocols: Hämtar protokoll från databasen...");
      const { data, error } = await supabase
        .from("protocols")
        .select("*")
        .order("created_at", { ascending: false });
      
      console.log("🔍 useProtocols: Query resultat - data:", data);
      console.log("🔍 useProtocols: Query resultat - error:", error);
      
      if (error) throw error;
      return data;
    },
  });

  const createProtocol = useMutation({
    mutationFn: async (protocolData: any) => {
      console.log("🔍 useProtocols: Försöker skapa protokoll med data:", protocolData);
      
      const { data, error } = await supabase
        .from("protocols")
        .insert(protocolData)
        .select()
        .single();
      
      console.log("🔍 useProtocols: Supabase svar - data:", data);
      console.log("🔍 useProtocols: Supabase svar - error:", error);
      
      if (error) {
        console.error("🚨 useProtocols: Supabase error detaljer:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      return data;
    },
    onSuccess: (newProtocol) => {
      console.log("🔍 useProtocols: Protokoll skapat, uppdaterar cache...", newProtocol);
      
      // Optimistic update - lägg till det nya protokollet direkt i cache
      queryClient.setQueryData(["protocols"], (old: any) => {
        console.log("🔍 useProtocols: Gammal cache data:", old);
        const updated = old ? [newProtocol, ...old] : [newProtocol];
        console.log("🔍 useProtocols: Ny cache data:", updated);
        return updated;
      });
      
      // Refetch för säkerhets skull
      queryClient.refetchQueries({ queryKey: ["protocols"] });
    },
    onError: (error) => {
      console.error("🚨 useProtocols: Mutation failed:", error);
    }
  });

  const updateProtocol = useMutation({
    mutationFn: async ({ id, ...protocolData }: any) => {
      const { data, error } = await supabase
        .from("protocols")
        .update(protocolData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      console.log("🔍 useProtocols: Protokoll uppdaterat, uppdaterar cache...");
      queryClient.refetchQueries({ queryKey: ["protocols"] });
    },
  });

  const deleteProtocol = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("protocols")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      console.log("🔍 useProtocols: Protokoll borttaget, uppdaterar cache...");
      queryClient.refetchQueries({ queryKey: ["protocols"] });
    },
  });

  return {
    protocols,
    createProtocol,
    updateProtocol,
    deleteProtocol,
  };
}