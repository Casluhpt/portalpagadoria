import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export function useProfile() {
  const { user } = useSession();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, nome, setor")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  return {
    profile: query.data ?? null,
    setor: (query.data?.setor as string | null) ?? null,
    nome: (query.data?.nome as string | null) ?? null,
    loading: query.isLoading,
  };
}
