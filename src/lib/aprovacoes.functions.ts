import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const APROVACAO_STATUS = ["Agendado", "Pago", "Recusado", "Pendente", "Cancelado"] as const;
export type AprovacaoStatus = (typeof APROVACAO_STATUS)[number];

export const APROVACAO_TIPOS = ["mensal", "adto"] as const;
export type AprovacaoTipo = (typeof APROVACAO_TIPOS)[number];

export type Aprovacao = {
  id: string;
  empresa: string | null;
  tipo: AprovacaoTipo;
  ordem_pagamento: string | null;
  valor: number;
  status: AprovacaoStatus;
  ano: number;
  ordem: number;
  created_at: string;
  updated_at: string;
};

export const listAprovacoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ ano: z.number().int().min(2000).max(2100).default(2026) }).parse(d))
  .handler(async ({ context, data }): Promise<Aprovacao[]> => {
    const { data: rows, error } = await (context.supabase as any)
      .from("aprovacoes")
      .select("*")
      .eq("ano", data.ano)
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (rows ?? []) as Aprovacao[];
  });

const rowSchema = z.object({
  id: z.string().uuid().optional(),
  empresa: z.string().max(120).nullable().optional(),
  tipo: z.enum(APROVACAO_TIPOS).default("mensal"),
  ordem_pagamento: z.string().max(80).nullable().optional(),
  valor: z.number().finite().default(0),
  status: z.enum(APROVACAO_STATUS).default("Pendente"),
  ano: z.number().int().min(2000).max(2100).default(2026),
  ordem: z.number().int().default(0),
});

export const upsertAprovacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => rowSchema.parse(d))
  .handler(async ({ context, data }): Promise<Aprovacao> => {
    const patch = {
      empresa: data.empresa ?? null,
      tipo: data.tipo,
      ordem_pagamento: data.ordem_pagamento ?? null,
      valor: data.valor,
      status: data.status,
      ano: data.ano,
      ordem: data.ordem,
    };
    if (data.id) {
      const { data: row, error } = await (context.supabase as any)
        .from("aprovacoes").update(patch).eq("id", data.id).select().single();
      if (error) throw error;
      return row as Aprovacao;
    }
    const { data: row, error } = await (context.supabase as any)
      .from("aprovacoes").insert(patch).select().single();
    if (error) throw error;
    return row as Aprovacao;
  });

export const bulkInsertAprovacoes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ rows: z.array(rowSchema).min(1).max(5000) }).parse(d))
  .handler(async ({ context, data }): Promise<{ inserted: number }> => {
    const payload = data.rows.map((r) => ({
      empresa: r.empresa ?? null,
      tipo: r.tipo,
      ordem_pagamento: r.ordem_pagamento ?? null,
      valor: r.valor,
      status: r.status,
      ano: r.ano,
      ordem: r.ordem,
    }));
    const { error } = await (context.supabase as any).from("aprovacoes").insert(payload);
    if (error) throw error;
    return { inserted: payload.length };
  });

export const deleteAprovacoes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await (context.supabase as any).from("aprovacoes").delete().in("id", data.ids);
    if (error) throw error;
    return { ok: true, count: data.ids.length };
  });
