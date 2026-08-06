import { supabase } from "@/integrations/supabase/client";
import type { Pagamento } from "./pagamentos-constants";

const TABLE = "pagamentos_diversos";

// Fields the client is allowed to write (excludes generated + auto fields).
const WRITABLE_KEYS = [
  "celula","arquivo_remessa","tipo_arquivo","ev_saida_folha_mensal","banco","empresa",
  "data_credito","descricao_pagamento","valor_lg","competencia","folha",
  "qtde_colaboradores","observacao","valor_bankmanager","status_bankmanager","valor_itau",
  "status_itau","natureza_pagamento",
] as const;

export type PagamentoInput = Partial<Pick<Pagamento, (typeof WRITABLE_KEYS)[number]>>;

function sanitize(patch: PagamentoInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of WRITABLE_KEYS) {
    if (k in patch) {
      let val = (patch as Record<string, unknown>)[k];
      // Garantir que datas vazias sejam enviadas como null para evitar erros de restrição no banco
      if (k === "data_credito" && (val === "" || val === undefined)) {
        val = null;
      }
      out[k] = val ?? null;
    }
  }
  return out;
}

export async function fetchPagamentos(): Promise<Pagamento[]> {
  const all: Pagamento[] = [];
  let from = 0;
  const PAGE = 1000;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(TABLE as any)
      .select("*")
      .order("registrado_em", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as unknown as Pagamento[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export async function createPagamento(patch: PagamentoInput, colaboradorNome: string, userId: string | null): Promise<Pagamento> {
  const row = {
    ...sanitize(patch),
    colaborador_nome: colaboradorNome,
    registrado_por: userId,
    registrado_em: new Date().toISOString(),
  };
  const { data, error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLE as any)
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Pagamento;
}

export async function createPagamentosBulk(
  rows: PagamentoInput[],
  colaboradorNome: string,
  userId: string | null,
  replaceAll = false,
): Promise<number> {
  if (!rows.length) return 0;
  
  if (replaceAll) {
    const { error } = await supabase.from(TABLE as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw error;
  }
  const now = new Date().toISOString();
  const payload = rows.map((r) => ({
    ...sanitize(r),
    colaborador_nome: colaboradorNome,
    registrado_por: userId,
    registrado_em: now,
  }));
  const { error, data } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLE as any)
    .insert(payload)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

export async function updatePagamento(id: string, patch: PagamentoInput): Promise<Pagamento> {
  const { data, error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLE as any)
    .update(sanitize(patch))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Pagamento;
}

export async function deletePagamento(id: string): Promise<void> {
  const { error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(TABLE as any)
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export const pagamentosQueryKey = ["pagamentos_diversos"] as const;
