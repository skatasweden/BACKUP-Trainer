import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  programs?: {
    id: string;
    name: string;
    price?: number;
    is_purchasable: boolean;
  };
  profiles?: {
    email: string;
    full_name?: string;
    role: string;
  };
}

export interface AthleteWithAccess {
  user_id: string;
  email: string;
  full_name?: string;
  access_type?: 'assigned' | 'purchased';
  access_id?: string;
  expires_at?: string;
  assigned_at?: string;
}

// Hook for coaches to manage program access
export function useProgramAccess(programId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get all access records for a specific program (coach view)
  const programAccess = useQuery({
    queryKey: ["program-access", programId],
    queryFn: async () => {
      if (!programId) return [];
      
      const { data, error } = await supabase
        .from("program_access")
        .select(`
          *,
          profiles!fk_program_access_user_profiles (
            email,
            full_name,
            role
          )
        `)
        .eq("program_id", programId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!programId && !!user,
  });

  // Get user's own program access (athlete view)
  const userProgramAccess = useQuery({
    queryKey: ["user-program-access", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("program_access")
        .select(`
          *,
          programs (
            id,
            name,
            price,
            is_purchasable
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as ProgramAccess[];
    },
    enabled: !!user?.id,
  });

  // Get available athletes query with optimized query
  const availableAthletes = useQuery({
    queryKey: ["available-athletes", programId],
    queryFn: async () => {
      if (!programId || !user?.id) return [];
      
      console.log('Fetching athletes for user:', user.email, 'program:', programId);
      
      // First verify we can access this program (user owns it)
      const { data: programData, error: programError } = await supabase
        .from("programs")
        .select("coach_id")
        .eq("id", programId)
        .single();
      
      if (programError) {
        console.error('Error fetching program:', programError);
        throw programError;
      }
      
      if (programData.coach_id !== user.id) {
        console.error('User does not own this program:', user.id, 'vs', programData.coach_id);
        throw new Error('Du äger inte detta program');
      }
      
      // Get all athletes first
      const { data: athletes, error: athletesError } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .eq("role", "athlete")
        .order("email");
      
      if (athletesError) {
        console.error('Error fetching athletes:', athletesError);
        throw athletesError;
      }
      
      console.log('Found athletes:', athletes?.length);
      
      // Get existing access for this specific program
      const { data: existingAccess, error: accessError } = await supabase
        .from("program_access")
        .select("*")
        .eq("program_id", programId);
      
      if (accessError) {
        console.error('Error fetching access:', accessError);
        throw accessError;
      }
      
      console.log('Found existing access:', existingAccess?.length);
      
      // Combine the data efficiently
      const result = athletes.map(athlete => {
        const access = existingAccess.find(a => a.user_id === athlete.user_id);
        return {
          user_id: athlete.user_id,
          email: athlete.email,
          full_name: athlete.full_name,
          access_type: access?.access_type as 'assigned' | 'purchased' | undefined,
          access_id: access?.id,
          expires_at: access?.expires_at,
          assigned_at: access?.created_at,
        };
      }) as AthleteWithAccess[];
      
      console.log('Final result:', result.length, 'athletes');
      return result;
    },
    enabled: !!programId && !!user?.id,
  });

  // Assign program to athlete (coach action)
  const assignProgram = useMutation({
    mutationFn: async ({ athleteId, expires_at }: { athleteId: string; expires_at?: string }) => {
      if (!programId || !user?.id) throw new Error("Missing required data");
      
      const { data, error } = await supabase
        .from("program_access")
        .insert({
          user_id: athleteId,
          program_id: programId,
          access_type: 'assigned',
          coach_id: user.id,
          expires_at,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-access", programId] });
      queryClient.invalidateQueries({ queryKey: ["available-athletes", programId] });
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast({
        title: "Program tilldelat",
        description: "Programmet har tilldelats till atleten",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message?.includes("duplicate") 
          ? "Atleten har redan tillgång till detta program" 
          : "Det gick inte att tilldela programmet",
        variant: "destructive",
      });
    },
  });

  // Remove program access (coach action)
  const removeAccess = useMutation({
    mutationFn: async (accessId: string) => {
      const { error } = await supabase
        .from("program_access")
        .delete()
        .eq("id", accessId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-access", programId] });
      queryClient.invalidateQueries({ queryKey: ["available-athletes", programId] });
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast({
        title: "Åtkomst borttagen",
        description: "Atletens åtkomst till programmet har tagits bort",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Det gick inte att ta bort åtkomsten",
        variant: "destructive",
      });
    },
  });

  // Update program access (e.g., extend expiry)
  const updateAccess = useMutation({
    mutationFn: async ({ accessId, expires_at }: { accessId: string; expires_at?: string }) => {
      const { data, error } = await supabase
        .from("program_access")
        .update({ expires_at })
        .eq("id", accessId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-access", programId] });
      queryClient.invalidateQueries({ queryKey: ["available-athletes", programId] });
      toast({
        title: "Åtkomst uppdaterad",
        description: "Atletens åtkomst har uppdaterats",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Det gick inte att uppdatera åtkomsten",
        variant: "destructive",
      });
    },
  });

  return {
    programAccess,
    userProgramAccess,
    availableAthletes,
    assignProgram,
    removeAccess,
    updateAccess,
  };
}

// Hook to check if user has access to a specific program
export function useHasProgramAccess(programId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["has-program-access", programId, user?.id],
    queryFn: async () => {
      if (!user?.id || !programId) return false;
      
      const { data, error } = await supabase
        .from("program_access")
        .select("id")
        .eq("user_id", user.id)
        .eq("program_id", programId)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id && !!programId,
  });
}