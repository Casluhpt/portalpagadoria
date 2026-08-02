import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const CATEGORIAS_DESPESAS = ["PJ", "Pensão", "Penhora", "Fornecedores"] as const;
export type CategoriaDespesa = (typeof CATEGORIAS_DESPESAS)[number];

export const GRUPOS_DESPESAS = ["PJ", "Penhora e Pensão", "Fornecedores"] as const;
export type GrupoDespesa = (typeof GRUPOS_DESPESAS)[number];

export const grupoDeCategoria = (c: CategoriaDespesa): GrupoDespesa =>
  c === "PJ" ? "PJ" : c === "Fornecedores" ? "Fornecedores" : "Penhora e Pensão";

export const EMPRESAS = [
  { codigo: "5700", nome: "LOCAFARMA" },
  { codigo: "2100", nome: "PROFARMA" },
  { codigo: "6700", nome: "SPECIALTY" },
  { codigo: "1000", nome: "TAMOIO" },
  { codigo: "5000", nome: "CSB" },
  { codigo: "8500", nome: "ROSÁRIO" },
  { codigo: "2500", nome: "PROFARMA HB" },
  { codigo: "5400", nome: "CSB HB" },
] as const;

export type DespesaFixaNota = {
  id: string;
  despesa_fixa_id: string;
  numero_nota: string | null;
  numero_pedido: string | null;
  valor: number;
  data_emissao: string | null;
  data_vencimento: string | null;
  data_lancamento: string;
  tipo: "Mensal" | "Adiantamento" | "Antecipação" | "PPR";
};

export type DespesaFixa = {
  id: string;
  categoria: CategoriaDespesa;
  descricao: string;
  ano: number;
  mes: number;
  valor: number;
  observacao: string | null;
  numero_pedido: string | null;
  numero_nf: string | null;
  tipo: "mensal" | "adiantamento" | "antecipação" | "ppr";
  data_lancamento: string | null;
  data_vencimento: string | null;
  data_emissao: string | null;
  competencia: string | null;
  conta: string | null;
  centro_custo: string | null;
  empresa_codigo: string | null;
  empresa_nome: string | null;
  lancado: boolean;
  suspensa: boolean;
  motivo_suspensao: string | null;
  nome_real: string | null;
  notas: string | null;
  ordem: number;
  valor_previsto_anual: number | null;
  saldo_inicial_pedido: number | null;
  sap_code: string | null;
  pedido_antigo: string | null;
  pedido_novo: string | null;
  created_by: string | null;
  created_by_nome: string | null;
  created_at: string;
  updated_at: string;
  nf_entries?: DespesaFixaNota[];
};

export const listDespesasFixas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ ano: z.number().int().min(2000).max(2100).default(2026) }).parse(d))
  .handler(async ({ context, data }): Promise<DespesaFixa[]> => {
    const { data: rows, error } = await context.supabase
      .from("despesas_fixas")
      .select("*, nf_entries:despesas_fixas_notas(*)")
      .eq("ano", data.ano)
      .order("categoria", { ascending: true })
      .order("ordem", { ascending: true })
      .order("descricao", { ascending: true })
      .order("mes", { ascending: true });
    if (error) throw error;
    return (rows ?? []) as unknown as DespesaFixa[];
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  categoria: z.enum(CATEGORIAS_DESPESAS),
  descricao: z.string().min(1).max(200),
  ano: z.number().int().min(2000).max(2100),
  mes: z.number().int().min(1).max(12),
  valor: z.number().finite(),
  observacao: z.string().max(500).nullable().optional(),
  numero_pedido: z.string().max(60).nullable().optional(),
  numero_nf: z.string().max(60).nullable().optional(),
  tipo: z.enum(["mensal", "adiantamento", "antecipação", "ppr"]).optional(),
  data_lancamento: z.string().nullable().optional(),
  data_vencimento: z.string().nullable().optional(),
  data_emissao: z.string().nullable().optional(),
  competencia: z.string().nullable().optional(),
  lancado: z.boolean().optional(),
  suspensa: z.boolean().optional(),
  motivo_suspensao: z.string().max(500).nullable().optional(),
});

export const upsertDespesaFixa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => upsertSchema.parse(d))
  .handler(async ({ context, data }): Promise<DespesaFixa> => {
    const nome =
      (context.claims as any)?.user_metadata?.nome ??
      (context.claims as any)?.email ??
      null;

    const patch: Record<string, any> = {
      categoria: data.categoria,
      descricao: data.descricao,
      ano: data.ano,
      mes: data.mes,
      valor: data.valor,
      observacao: data.observacao ?? null,
      numero_pedido: data.numero_pedido ?? null,
      numero_nf: data.numero_nf ?? null,
      tipo: data.tipo ?? "mensal",
      data_lancamento: data.data_lancamento ?? null,
      data_vencimento: data.data_vencimento ?? null,
      data_emissao: data.data_emissao ?? null,
      competencia: data.competencia ?? null,
      lancado: data.lancado ?? false,
      suspensa: data.suspensa ?? false,
      motivo_suspensao: data.motivo_suspensao ?? null,
    };

    if (data.id) {
      const { data: row, error } = await (context.supabase as any)
        .from("despesas_fixas")
        .update(patch)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw error;
      return row as unknown as DespesaFixa;
    }
    const { data: row, error } = await (context.supabase as any)
      .from("despesas_fixas")
      .insert({ ...patch, created_by: context.userId, created_by_nome: nome })
      .select()
      .single();

    if (error) throw error;
    return row as unknown as DespesaFixa;
  });

export const deleteDespesaFixa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("despesas_fixas").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Atualiza metadados de uma "descrição" (empresa, conta, centro de custo, pedido)
 *  aplicando para todas as linhas com mesma categoria+descricao+ano. */
export const updateDescricaoMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z.object({
      categoria: z.enum(CATEGORIAS_DESPESAS),
      descricao: z.string().min(1).max(200),
      ano: z.number().int().min(2000).max(2100),
      empresa_codigo: z.string().max(20).nullable().optional(),
      empresa_nome: z.string().max(120).nullable().optional(),
      conta: z.string().max(120).nullable().optional(),
      centro_custo: z.string().max(120).nullable().optional(),
      numero_pedido: z.string().max(60).nullable().optional(),
      nova_descricao: z.string().min(1).max(200).optional(),
      nome_real: z.string().max(200).nullable().optional(),
      notas: z.string().max(2000).nullable().optional(),
      valor_previsto_anual: z.number().nullable().optional(),
      saldo_inicial_pedido: z.number().nullable().optional(),
      sap_code: z.string().max(60).nullable().optional(),
      pedido_antigo: z.string().max(60).nullable().optional(),
      pedido_novo: z.string().max(60).nullable().optional(),
      suspensa: z.boolean().optional(),
      motivo_suspensao: z.string().max(500).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const patch: Record<string, any> = {
      empresa_codigo: data.empresa_codigo ?? null,
      empresa_nome: data.empresa_nome ?? null,
      conta: data.conta ?? null,
      centro_custo: data.centro_custo ?? null,
    };
    if (data.numero_pedido !== undefined) patch.numero_pedido = data.numero_pedido ?? null;
    if (data.nome_real !== undefined) patch.nome_real = data.nome_real ?? null;
    if (data.notas !== undefined) patch.notas = data.notas ?? null;
    if (data.valor_previsto_anual !== undefined) patch.valor_previsto_anual = data.valor_previsto_anual;
    if (data.saldo_inicial_pedido !== undefined) patch.saldo_inicial_pedido = data.saldo_inicial_pedido;
    if (data.sap_code !== undefined) patch.sap_code = data.sap_code;
    if (data.pedido_antigo !== undefined) patch.pedido_antigo = data.pedido_antigo;
    if (data.pedido_novo !== undefined) patch.pedido_novo = data.pedido_novo;
    if (data.suspensa !== undefined) patch.suspensa = data.suspensa;
    if (data.motivo_suspensao !== undefined) patch.motivo_suspensao = data.motivo_suspensao;
    if (data.nova_descricao && data.nova_descricao !== data.descricao) {
      patch.descricao = data.nova_descricao;
    }

    const { error } = await (context.supabase as any)
      .from("despesas_fixas")
      .update(patch)
      .eq("categoria", data.categoria)
      .eq("descricao", data.descricao)
      .eq("ano", data.ano);

    if (error) throw error;
    return { ok: true };
  });

export const getPedidoOrcamentoStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ numero_pedido: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    // 1. Get initial budget
    const { data: pedido } = await context.supabase
      .from("pedidos_orcamento")
      .select("*")
      .eq("numero_pedido", data.numero_pedido)
      .single();

    // 2. Sum all expenses for this order
    const { data: expenses } = await context.supabase
      .from("despesas_fixas")
      .select("valor, lancado")
      .eq("numero_pedido", data.numero_pedido);

    const totalPrevisto = (expenses ?? []).reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    const totalRealizado = (expenses ?? []).filter(e => e.lancado).reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    const saldoInicial = Number(pedido?.saldo_inicial) || 0;

    return {
      numero_pedido: data.numero_pedido,
      saldo_inicial: saldoInicial,
      total_previsto: totalPrevisto,
      total_realizado: totalRealizado,
      saldo_remanescente: saldoInicial - totalRealizado,
      excedido: totalRealizado > saldoInicial
    };
  });

export const updatePedidoOrcamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({
    numero_pedido: z.string(),
    saldo_inicial: z.number().optional(),
    descricao: z.string().optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("pedidos_orcamento")
      .upsert({
        numero_pedido: data.numero_pedido,
        saldo_inicial: data.saldo_inicial,
        descricao: data.descricao,
        updated_at: new Date().toISOString()
      }, { onConflict: 'numero_pedido' });

    if (error) throw error;
    return { ok: true };
  });

