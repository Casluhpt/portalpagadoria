import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export function useRoles() {
  const { user, loading: sessionLoading } = useSession();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ["user-roles", userId],
    enabled: !!userId,
    queryFn: async (): Promise<AppRole[]> => {
      // Ensure a signed-in user has at least the viewer role.
      try {
        await supabase.rpc("ensure_viewer_role" as never);
      } catch {
        /* ignore */
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
    staleTime: 60_000,
  });

  const roles = query.data ?? [];
  const has = (role: AppRole) => roles.includes(role);
  const hasAny = (list: AppRole[]) => list.some((r) => roles.includes(r));
  const isViewer = roles.length > 0 && roles.every((r) => r === "viewer");

  return {
    roles,
    loading: sessionLoading || query.isLoading,
    isAdmin: has("administrador"),
    isAuditor: has("auditor"),
    isOperacional: has("operacional"),
    isCriador: has("criador_competencia"),
    isConsulta: has("consulta"),
    isGerente: has("gerente"),
    isViewer,
    has,
    hasAny,
  };
}
