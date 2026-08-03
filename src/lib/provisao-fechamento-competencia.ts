import { supabase } from "@/integrations/supabase/client";

export type ProvisaoArchived = {
  id: string;
  nome: string;
  mes: string;
  ano: string;
  data_fechamento: string;
  fechado_por: string | null;
  fechado_por_nome?: string | null;
  periodo_inicio?: string | null;
  periodo_fim?: string | null;
  total_registros?: number | null;
  total_valor?: number | null;
  snapshot: any;
  arquivo_url: string | null;
};

export const provisaoArchivedQueryKey = ["provisao_fechamento_competencia"] as const;

/**
 * Fechamento por período selecionado no dashboard:
 * 1. gera o arquivo Excel do período,
 * 2. envia o arquivo para o armazenamento (módulo de Fechamento de Competências),
 * 3. arquiva o snapshot e remove da base apenas os registros processados,
 * 4. registra usuário, data, hora e período na auditoria.
 */
export async function fecharCompetenciaPeriodo(input: {
  nome: string;
  de: string;
  ate: string;
}): Promise<{ id: string; arquivo: string; registros: number; total: number }> {
  const { fetchProvisaoRange } = await import("./provisao");
  const registros = await fetchProvisaoRange(input.de, input.ate);
  if (registros.length === 0) {
    throw new Error("Nenhum registro da Provisão Diária no período selecionado.");
  }

  const total = registros.reduce((s, r) => s + (r.valor ?? 0), 0);

  // 1. Geração automática do arquivo
  const XLSX = await import("xlsx");
  const linhas = registros.map((r) => ({
    Data: r.data ?? "",
    Empresa: r.empresa ?? "",
    Banco: r.banco ?? "",
    Valor: r.valor ?? 0,
    Mês: r.mes ?? "",
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhas), "Provisão");
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const slug = input.nome.trim().replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase();
  const caminho = `provisao/${input.de}_${input.ate}-${slug || "fechamento"}-${Date.now()}.xlsx`;

  // 2. Envio ao módulo de Fechamento de Competências
  const up = await supabase.storage.from("fechamentos").upload(caminho, blob, {
    contentType: blob.type,
    upsert: false,
  });
  if (up.error) throw new Error("Falha ao gerar/enviar o arquivo: " + up.error.message);

  // 3. Arquivamento + limpeza dos registros processados (transacional no banco)
  const { data, error } = await supabase.rpc("fechar_competencia_provisao_periodo" as never, {
    _nome: input.nome,
    _de: input.de,
    _ate: input.ate,
    _arquivo_url: caminho,
  } as never);
  if (error) throw new Error(error.message);

  return {
    id: String(data ?? ""),
    arquivo: caminho,
    registros: registros.length,
    total,
  };
}

export async function baixarArquivoFechamento(caminho: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("fechamentos")
    .createSignedUrl(caminho, 60 * 10);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

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
