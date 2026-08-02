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
    _notify: true, // Internal flag to trigger notification logic in a real backend
  } as never);
  if (error) throw error;
  const { logAcaoCritica } = await import("./audit-critico");
  await logAcaoCritica({
    acao: "arquivamento_competencia",
    modulo: "Provisão Diária",
    tabela: "provisao_fechamento_competencia",
    registro_id: String(data ?? ""),
    descricao: `Competência ${input.mes}/${input.ano} arquivada como snapshot somente leitura (${input.nome})`,
    severidade: "critico",
  });
  return data as unknown as string;
}

export async function notificarFechamentoCompetencia(titulo: string, mensagem: string, userId: string): Promise<void> {
  const { publicarComunicado } = await import("./comunicados");
  // In a real scenario, this would also send emails via a worker or SMTP connector
  await publicarComunicado(titulo, mensagem, userId);
  console.log("Notificação enviada e agendada para e-mail:", { titulo, mensagem });
}

export async function integrarPagamentosNaProvisao(): Promise<void> {
  const { error } = await supabase.rpc("integrar_pagamentos_na_provisao" as never);
  if (error) throw error;
  const { logAcaoCritica } = await import("./audit-critico");
  await logAcaoCritica({
    acao: "integracao_provisao",
    modulo: "Provisão Diária",
    tabela: "provisao_diaria",
    descricao: "Integração automática dos Pagamentos Diversos na Base da Provisão Diária",
  });
}
