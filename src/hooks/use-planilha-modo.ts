import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { APRENDIZADO_KEY } from "@/lib/planilha-inteligente";

/**
 * Modo de operação das planilhas do portal.
 *  - "inteligente": Planilha Inteligente ativa (sugestões, padrões e validações).
 *  - "tradicional": fluxo clássico, sem qualquer perda de funcionalidade.
 *
 * A preferência é salva no perfil do usuário e pode ser alterada a qualquer
 * momento em Configurações. Também mantemos um espelho em localStorage para
 * leitura imediata (sem flicker) antes do perfil carregar.
 */
export type PlanilhaModo = "inteligente" | "tradicional";

export const PLANILHA_MODO_LABEL: Record<PlanilhaModo, string> = {
  inteligente: "Modo Inteligente",
  tradicional: "Modo Tradicional",
};

const cacheKey = (uid: string) => `planilha_modo:${uid}`;

function lerCache(uid: string | null): PlanilhaModo | null {
  if (typeof window === "undefined" || !uid) return null;
  const v = localStorage.getItem(cacheKey(uid));
  return v === "inteligente" || v === "tradicional" ? v : null;
}

function gravarCache(uid: string, modo: PlanilhaModo) {
  try {
    localStorage.setItem(cacheKey(uid), modo);
    // Compatibilidade com o flag legado usado pela planilha.
    localStorage.setItem(APRENDIZADO_KEY, String(modo === "inteligente"));
  } catch {
    /* noop */
  }
}

export interface PreferenciaPlanilha {
  modo: PlanilhaModo | null;
  apresentadoEm: string | null;
}

export function usePlanilhaModo() {
  const { user } = useSession();
  const uid = user?.id ?? null;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["planilha-modo", uid],
    enabled: !!uid,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<PreferenciaPlanilha> => {
      const { data: row, error } = await supabase
        .from("profiles")
        .select("planilha_inteligente, planilha_onboarding_em")
        .eq("id", uid as string)
        .maybeSingle();
      if (error) throw error;
      const pref = row?.planilha_inteligente;
      const modo: PlanilhaModo | null =
        pref == null ? null : pref ? "inteligente" : "tradicional";
      if (modo && uid) gravarCache(uid, modo);
      return { modo, apresentadoEm: row?.planilha_onboarding_em ?? null };
    },
  });

  const salvar = useMutation({
    mutationFn: async ({ modo, registrarApresentacao }: { modo: PlanilhaModo; registrarApresentacao?: boolean }) => {
      if (!uid) throw new Error("Usuário não autenticado");
      const patch: { planilha_inteligente: boolean; planilha_onboarding_em?: string } = {
        planilha_inteligente: modo === "inteligente",
      };
      if (registrarApresentacao) patch.planilha_onboarding_em = new Date().toISOString();
      const { error } = await supabase.from("profiles").update(patch).eq("id", uid);
      if (error) throw error;
      gravarCache(uid, modo);
      return modo;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planilha-modo", uid] });
    },
  });

  const definirModo = useCallback(
    (modo: PlanilhaModo, registrarApresentacao = false) =>
      salvar.mutateAsync({ modo, registrarApresentacao }),
    [salvar],
  );

  // Fallback local enquanto o perfil carrega; padrão = Modo Tradicional.
  const modo: PlanilhaModo = data?.modo ?? lerCache(uid) ?? "tradicional";

  return {
    modo,
    inteligente: modo === "inteligente",
    /** true quando o usuário ainda não escolheu (primeiro acesso). */
    precisaApresentar: !!uid && !isLoading && data != null && data.modo == null && !data.apresentadoEm,
    isLoading,
    definirModo,
    salvando: salvar.isPending,
  };
}
