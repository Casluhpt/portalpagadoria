import { supabase } from "@/integrations/supabase/client";

export type Lancamento = {
  id: string;
  prePedido: number | null;
  issuer: string | null;
  supplier: string | null;
  invoiceNumber: string | null;
  accountGroup: string | null;
  center: string | null;
  company: number | null;
  dueDate: string | null;
  grossAmount: number | null;
  registerDate: string | null;
  descStatus: string | null;
  log: string | null;
  text: string | null;
  action: string | null;
  Empresa: string | null;
};

type Row = {
  id: string;
  pre_pedido: number | null;
  issuer: string | null;
  supplier: string | null;
  invoice_number: string | null;
  account_group: string | null;
  center: string | null;
  company: number | null;
  due_date: string | null;
  gross_amount: number | null;
  register_date: string | null;
  desc_status: string | null;
  log: string | null;
  text_field: string | null;
  action: string | null;
  empresa: string | null;
};

const toModel = (r: Row): Lancamento => ({
  id: r.id,
  prePedido: r.pre_pedido,
  issuer: r.issuer,
  supplier: r.supplier,
  invoiceNumber: r.invoice_number,
  accountGroup: r.account_group,
  center: r.center,
  company: r.company,
  dueDate: r.due_date,
  grossAmount: r.gross_amount == null ? null : Number(r.gross_amount),
  registerDate: r.register_date,
  descStatus: r.desc_status,
  log: r.log,
  text: r.text_field,
  action: r.action,
  Empresa: r.empresa,
});

const toRow = (m: Partial<Lancamento>): Partial<Row> => {
  const out: Partial<Row> = {};
  if ("prePedido" in m) out.pre_pedido = m.prePedido ?? null;
  if ("issuer" in m) out.issuer = m.issuer ?? null;
  if ("supplier" in m) out.supplier = m.supplier ?? null;
  if ("invoiceNumber" in m) out.invoice_number = m.invoiceNumber ?? null;
  if ("accountGroup" in m) out.account_group = m.accountGroup ?? null;
  if ("center" in m) out.center = m.center ?? null;
  if ("company" in m) out.company = m.company ?? null;
  if ("dueDate" in m) out.due_date = m.dueDate ?? null;
  if ("grossAmount" in m) out.gross_amount = m.grossAmount ?? null;
  if ("registerDate" in m) out.register_date = m.registerDate ?? null;
  if ("descStatus" in m) out.desc_status = m.descStatus ?? null;
  if ("log" in m) out.log = m.log ?? null;
  if ("text" in m) out.text_field = m.text ?? null;
  if ("action" in m) out.action = m.action ?? null;
  if ("Empresa" in m) out.empresa = m.Empresa ?? null;
  return out;
};

const PAGE = 1000;

export async function fetchAllLancamentos(): Promise<Lancamento[]> {
  const all: Row[] = [];
  let from = 0;
  // paginate to bypass 1000-row default limit
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from("lancamentos")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as Row[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all.map(toModel);
}

export async function createLancamento(patch: Partial<Lancamento>): Promise<Lancamento> {
  const { data, error } = await supabase
    .from("lancamentos")
    .insert(toRow(patch))
    .select("*")
    .single();
  if (error) throw error;
  return toModel(data as Row);
}

export async function updateLancamento(id: string, patch: Partial<Lancamento>): Promise<Lancamento> {
  const { data, error } = await supabase
    .from("lancamentos")
    .update(toRow(patch))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return toModel(data as Row);
}

export async function deleteLancamento(id: string): Promise<void> {
  const { error } = await supabase.from("lancamentos").delete().eq("id", id);
  if (error) throw error;
}

export const lancamentosQueryKey = ["lancamentos"] as const;

/** Cabeçalhos aceitos na importação Excel (rótulo → campo do modelo). */
export const LANCAMENTO_COLUNAS: { label: string; key: keyof Omit<Lancamento, "id">; tipo: "texto" | "numero" | "data" }[] = [
  { label: "Pré-Pedido", key: "prePedido", tipo: "numero" },
  { label: "Issuer", key: "issuer", tipo: "texto" },
  { label: "Supplier", key: "supplier", tipo: "texto" },
  { label: "Invoice Number", key: "invoiceNumber", tipo: "texto" },
  { label: "Account Group", key: "accountGroup", tipo: "texto" },
  { label: "Center", key: "center", tipo: "texto" },
  { label: "Company", key: "company", tipo: "numero" },
  { label: "Due Date", key: "dueDate", tipo: "data" },
  { label: "Gross Amount", key: "grossAmount", tipo: "numero" },
  { label: "Register Date", key: "registerDate", tipo: "data" },
  { label: "Desc Status", key: "descStatus", tipo: "texto" },
  { label: "Log", key: "log", tipo: "texto" },
  { label: "Text", key: "text", tipo: "texto" },
  { label: "Action", key: "action", tipo: "texto" },
  { label: "Empresa", key: "Empresa", tipo: "texto" },
];

/** Importa lançamentos em lote. `substituir` limpa a base antes (exclusão lógica no banco). */
export async function importLancamentosBulk(
  registros: Partial<Lancamento>[],
  substituir: boolean,
): Promise<number> {
  if (substituir) {
    const atuais = await fetchAllLancamentos();
    for (const r of atuais) await deleteLancamento(r.id);
  }
  const rows = registros.map((r) => toRow(r));
  const CHUNK = 400;
  let total = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error, data } = await supabase
      .from("lancamentos")
      .insert(rows.slice(i, i + CHUNK) as never)
      .select("id");
    if (error) throw error;
    total += data?.length ?? 0;
  }
  return total;
}
