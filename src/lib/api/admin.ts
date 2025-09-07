import { supabase } from "@/integrations/supabase/client";

export interface AdminUpdateUserPayload {
  user_id: string;
  email?: string;
  phone?: string;
  password?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
  action?: 'update' | 'delete';
}

// Use the same URL as the Supabase client
const SUPABASE_URL = "https://vbzsekswvvhyzsmkljqz.supabase.co";

export async function callAdminUpdateUser(payload: AdminUpdateUserPayload) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  
  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-update-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  
  if (!res.ok) {
    throw new Error(json?.error || "Admin update failed");
  }
  
  return json;
}

export async function updateUserEmail(userId: string, email: string) {
  return callAdminUpdateUser({
    user_id: userId,
    email,
  });
}

export async function updateUserPassword(userId: string, password: string) {
  return callAdminUpdateUser({
    user_id: userId,
    password,
  });
}

export async function deleteUser(userId: string) {
  return callAdminUpdateUser({
    user_id: userId,
    action: 'delete',
  });
}