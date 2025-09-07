import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function useRequireAuth() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthed(false);
        nav("/auth");
      } else {
        setAuthed(true);
      }
      setReady(true);
    })();
  }, [nav]);

  return { ready, authed };
}