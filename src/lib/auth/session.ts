import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/types/auth';

interface SessionWithRole {
  session: any;
  role: AppRole | null;
}

export async function getSessionAndRole(): Promise<SessionWithRole> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { session: null, role: null };

  // Get user role from profiles table
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();

  if (error) {
    console.error('Error fetching user role:', error);
    throw error;
  }

  return { session, role: data?.role ?? null };
}