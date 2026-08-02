import { supabase } from "@/integrations/supabase/client";

export type ProvisaoArchived = {
  id: string;
  nome: string;
  mes: string;
  ano: string;
  data_fechamento: string;
  fechado_por: string | null;
  snapshot: any;
  arquivo_url: string | null;
};

export const provisaoArchivedQueryKey = ["provisao_fechamento_competencia"] as const;

export async function fetchArchivedProvisao(): Promise<ProvisaoArchived[]> {
  const { data, error } = await supabase
    .from("provisao_fechamento_competencia" as any)
    .select("*")
    .order("data_fechamento", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ProvisaoArchived[];
}

export async function fecharCompetenciaProvisao(input: {
  nome: string;
  mes: string;
  ano: string;
  usuarioId: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc("fechar_competencia_provisao" as never, {
    _nome: input.nome,
    _mes: input.mes,
    _ano: input.ano,
    _usuario_id: input.usuarioId,
  } as never);
  if (error) throw error;
  return data as unknown as string;
}

export async function integrarPagamentosNaProvisao(): Promise<void> {
  const { error } = await supabase.rpc("integrar_pagamentos_na_provisao" as never);
  if (error) throw error;
}
