import { supabase } from "@/integrations/supabase/client";

export type ProvisaoFechamento = {
  data: string;
  fechada_em: string;
  fechada_por: string | null;
  fechada_por_nome: string | null;
};

export type StatusSolicitacao = "pendente" | "aprovada" | "rejeitada";

export type PagamentoSolicitacao = {
  id: string;
  solicitante_id: string | null;
  solicitante_nome: string | null;
  data_credito: string;
  payload: Record<string, unknown>;
  motivo: string | null;
  status: StatusSolicitacao;
  criado_em: string;
  decidido_em: string | null;
  decidido_por: string | null;
  decidido_por_nome: string | null;
  motivo_decisao: string | null;
  pagamento_id: string | null;
};

export const provisaoFechamentosKey = ["provisao_fechamentos"] as const;
export const solicitacoesKey = ["pagamento_solicitacoes"] as const;

export const todayISO = () => new Date().toISOString().slice(0, 10);

export async function fetchFechamentoDia(data: string): Promise<ProvisaoFechamento | null> {
  const { data: row, error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("provisao_fechamentos" as any)
    .select("*")
    .eq("data", data)
    .maybeSingle();
  if (error) throw error;
  return (row as ProvisaoFechamento | null) ?? null;
}

export async function fecharProvisaoDia(data: string = todayISO()): Promise<ProvisaoFechamento> {
  const { data: row, error } = await supabase.rpc("fechar_provisao_diaria" as never, { _data: data } as never);
  if (error) throw error;
  const { logAcaoCritica } = await import("./audit-critico");
  await logAcaoCritica({
    acao: "fechamento_competencia",
    modulo: "Provisão Diária",
    tabela: "provisao_fechamentos",
    registro_id: data,
    descricao: `Fechamento da provisão do dia ${data}`,
    severidade: "alerta",
  });
  return row as unknown as ProvisaoFechamento;
}

export async function reabrirProvisaoDia(data: string, justificativa?: string): Promise<void> {
  const { error } = await supabase.rpc("reabrir_provisao_diaria" as never, { _data: data } as never);
  if (error) throw error;
  const { logAcaoCritica } = await import("./audit-critico");
  await logAcaoCritica({
    acao: "reabertura_competencia",
    modulo: "Provisão Diária",
    tabela: "provisao_fechamentos",
    registro_id: data,
    descricao: `Reabertura da provisão do dia ${data}`,
    justificativa: justificativa ?? null ?? undefined,
    severidade: "critico",
  });
}

export async function criarSolicitacaoProvisao(input: {
  solicitanteId: string;
  solicitanteNome: string;
  dataCredito: string;
  payload: Record<string, unknown>;
  motivo: string;
}): Promise<PagamentoSolicitacao> {
  const { data, error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("pagamento_solicitacoes" as any)
    .insert({
      solicitante_id: input.solicitanteId,
      solicitante_nome: input.solicitanteNome,
      data_credito: input.dataCredito,
      payload: input.payload,
      motivo: input.motivo || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as PagamentoSolicitacao;
}

export async function fetchSolicitacoes(): Promise<PagamentoSolicitacao[]> {
  const { data, error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("pagamento_solicitacoes" as any)
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PagamentoSolicitacao[];
}

export async function aprovarSolicitacao(id: string, motivo?: string): Promise<void> {
  const { error } = await supabase.rpc("aprovar_solicitacao_provisao" as never, { _id: id, _motivo: motivo ?? null } as never);
  if (error) throw error;
}

export async function rejeitarSolicitacao(id: string, motivo?: string): Promise<void> {
  const { error } = await supabase.rpc("rejeitar_solicitacao_provisao" as never, { _id: id, _motivo: motivo ?? null } as never);
  if (error) throw error;
}

/** Extract "YYYY-MM-DD" from a trigger error message like "PROVISAO_FECHADA:2026-07-10". */
export function extractProvisaoFechadaDate(msg: string): string | null {
  const m = /PROVISAO_FECHADA:(\d{4}-\d{2}-\d{2})/.exec(msg);
  return m ? m[1] : null;
}
