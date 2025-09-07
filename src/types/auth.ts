import type { Database } from '@/integrations/supabase/types';

export type AppRole = Database['public']['Enums']['user_role'];
export type RoleRequirement = AppRole | AppRole[];