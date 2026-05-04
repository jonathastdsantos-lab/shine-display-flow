import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Verifica de forma segura (server-side) se o usuário atual tem role 'admin'.
 * Usa a tabela public.user_roles + função has_role (security definer).
 * NUNCA confie no email do cliente — sempre consulte o servidor.
 */
export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (cancelled) return;
      setIsAdmin(!error && !!data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { isAdmin, loading };
}
