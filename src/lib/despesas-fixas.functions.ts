import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const CATEGORIAS_DESPESAS = ["PJ", "Pensão", "Penhora", "Fornecedores"] as const;
export type CategoriaDespesa = (typeof CATEGORIAS_DESPESAS)[number];

export type DespesaFixa = {
  id: string;
  categoria: CategoriaDespesa;
  descricao: string;
  ano: number;
  mes: number;
  valor: number;
  observacao: string | null;
  created_by: string | null;
  created_by_nome: string | null;
  created_at: string;
  updated_at: string;
};

export const listDespesasFixas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ ano: z.number().int().min(2000).max(2100).default(2026) }).parse(d))
  .handler(async ({ context, data }): Promise<DespesaFixa[]> => {
    const { data: rows, error } = await context.supabase
      .from("despesas_fixas")
      .select("*")
      .eq("ano", data.ano)
      .order("categoria", { ascending: true })
      .order("descricao", { ascending: true })
      .order("mes", { ascending: true });
    if (error) throw error;
    return (rows ?? []) as DespesaFixa[];
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  categoria: z.enum(CATEGORIAS_DESPESAS),
  descricao: z.string().min(1).max(200),
  ano: z.number().int().min(2000).max(2100),
  mes: z.number().int().min(1).max(12),
  valor: z.number().finite(),
  observacao: z.string().max(500).nullable().optional(),
});

export const upsertDespesaFixa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => upsertSchema.parse(d))
  .handler(async ({ context, data }): Promise<DespesaFixa> => {
    const nome =
      (context.claims as any)?.user_metadata?.nome ??
      (context.claims as any)?.email ??
      null;

    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("despesas_fixas")
        .update({
          categoria: data.categoria,
          descricao: data.descricao,
          ano: data.ano,
          mes: data.mes,
          valor: data.valor,
          observacao: data.observacao ?? null,
        })
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw error;
      return row as DespesaFixa;
    }
    const { data: row, error } = await context.supabase
      .from("despesas_fixas")
      .insert({
        categoria: data.categoria,
        descricao: data.descricao,
        ano: data.ano,
        mes: data.mes,
        valor: data.valor,
        observacao: data.observacao ?? null,
        created_by: context.userId,
        created_by_nome: nome,
      })
      .select()
      .single();
    if (error) throw error;
    return row as DespesaFixa;
  });

export const deleteDespesaFixa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("despesas_fixas").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
