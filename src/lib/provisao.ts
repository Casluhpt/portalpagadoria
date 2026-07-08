import { supabase } from "@/integrations/supabase/client";

export type Provisao = {
  id: string;
  data: string | null;
  empresa: string | null;
  banco: string | null;
  valor: number | null;
};

type Row = {
  id: string;
  data: string | null;
  empresa: string | null;
  banco: string | null;
  valor: number | null;
};

const toModel = (r: Row): Provisao => ({
  id: r.id,
  data: r.data,
  empresa: r.empresa,
  banco: r.banco,
  valor: r.valor == null ? null : Number(r.valor),
});

const toRow = (m: Partial<Provisao>) => {
  const out: Record<string, unknown> = {};
  if ("data" in m) out.data = m.data ?? null;
  if ("empresa" in m) out.empresa = m.empresa ?? null;
  if ("banco" in m) out.banco = m.banco ?? null;
  if ("valor" in m) out.valor = m.valor ?? null;
  return out;
};

const PAGE = 1000;

export async function fetchAllProvisao(): Promise<Provisao[]> {
  const all: Row[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("provisao_diaria")
      .select("*")
      .order("data", { ascending: false, nullsFirst: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as Row[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all.map(toModel);
}

export async function createProvisao(patch: Partial<Provisao>): Promise<Provisao> {
  const { data, error } = await supabase
    .from("provisao_diaria")
    .insert(toRow(patch))
    .select("*")
    .single();
  if (error) throw error;
  return toModel(data as Row);
}

export async function updateProvisao(id: string, patch: Partial<Provisao>): Promise<Provisao> {
  const { data, error } = await supabase
    .from("provisao_diaria")
    .update(toRow(patch))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return toModel(data as Row);
}

export async function deleteProvisao(id: string): Promise<void> {
  const { error } = await supabase.from("provisao_diaria").delete().eq("id", id);
  if (error) throw error;
}

export async function bulkInsertProvisao(rows: Partial<Provisao>[]): Promise<number> {
  if (rows.length === 0) return 0;
  const CHUNK = 500;
  let total = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK).map(toRow);
    const { error, count } = await supabase
      .from("provisao_diaria")
      .insert(slice, { count: "exact" });
    if (error) throw error;
    total += count ?? slice.length;
  }
  return total;
}

export const provisaoQueryKey = ["provisao_diaria"] as const;
