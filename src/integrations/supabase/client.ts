
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase configuration - these are public values safe to hardcode
const SUPABASE_URL = "https://vbzsekswvvhyzsmkljqz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZienNla3N3dnZoeXpzbWtsanF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTc1ODEsImV4cCI6MjA3MjIzMzU4MX0.LLC9bBl2lwl15ax4JqRvDN7VntGrs1x_vUYxYX3ZYeA";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
