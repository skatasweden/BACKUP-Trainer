import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface PaymentSession {
  url: string;
  session_id: string;
}

// Secure hook for creating Stripe checkout sessions (server-controlled)
export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      programId 
    }: { 
      programId: string; 
    }) => {
      if (!user?.id) throw new Error("User must be authenticated");
      
      // Call secure server-side checkout creation
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          program_id: programId, // Server determines price from program_id
        }
      });

      if (error) throw error;
      return data as PaymentSession;
    },
    onSuccess: (data) => {
      // Detect iPhone Safari for special handling
      const isIPhoneSafari = /iPhone|iPad|iPod/.test(navigator.userAgent) && 
                            /Safari/.test(navigator.userAgent) && 
                            !/CriOS|FxiOS/.test(navigator.userAgent);
      
      console.log('[PAYMENT] Redirecting to Stripe:', data.url);
      console.log('[PAYMENT] iPhone Safari detected:', isIPhoneSafari);
      
      try {
        if (isIPhoneSafari) {
          // For iPhone Safari: Use immediate, direct redirect without delay
          window.top.location.href = data.url;
        } else {
          // For other browsers: Standard redirect
          window.location.href = data.url;
        }
      } catch (error) {
        console.error('[PAYMENT] Direct redirect failed:', error);
        
        // Show immediate fallback with prominent action button
        toast({
          title: "Öppna Stripe betalning",
          description: "Klicka på knappen nedan för att fortsätta till betalningen",
          duration: 10000, // Keep visible longer
          action: (
            <a 
              href={data.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={() => {
                // Try one more redirect attempt when user clicks
                try {
                  window.open(data.url, '_self');
                } catch (e) {
                  console.log('[PAYMENT] User clicked fallback link');
                }
              }}
            >
              Öppna betalning
            </a>
          ),
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Betalningsfel",
        description: error.message || "Det gick inte att starta betalningen",
        variant: "destructive",
      });
    },
  });
}

// Hook to check payment status from database (server source of truth)
export function useCheckPaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ programId }: { programId: string }) => {
      // Check program access from database (secure, server-controlled)
      const { data, error } = await supabase
        .from('program_access')
        .select('*')
        .eq('program_id', programId)
        .eq('access_type', 'purchased')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { hasAccess: !!data };
    },
    onSuccess: () => {
      // Refresh program-related queries
      queryClient.invalidateQueries({ queryKey: ["athlete-programs"] });
      queryClient.invalidateQueries({ queryKey: ["user-program-access"] });
    },
  });
}

// REMOVED: useHandlePaymentSuccess - payment status is now determined by webhook only
// The client never determines payment success, only reads from the database