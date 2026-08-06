import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const purgarPagamentosBulkFn = createServerFn({ method: "POST" })
  .validator((data) => z.object({
    ids: z.array(z.string()),
    colaboradorNome: z.string(),
    userId: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { logAcaoCritica } = await import("./audit-critico");

    // Fetch snapshots for audit BEFORE deletion
    const { data: snapshots, error: fetchError } = await supabaseAdmin
      .from("pagamentos_diversos")
      .select("*")
      .in("id", data.ids);
    
    if (fetchError) throw new Error("Erro ao buscar registros para auditoria: " + fetchError.message);

    // Delete using admin client to bypass possible RLS or complex trigger issues
    const { error: deleteError } = await supabaseAdmin
      .from("pagamentos_diversos")
      .delete()
      .in("id", data.ids);

    if (deleteError) throw new Error("Erro ao excluir registros: " + deleteError.message);

    // Log the action for each record
    if (snapshots) {
      const brl = (n: number | null | undefined) =>
        n == null ? "" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

      await Promise.all(
        snapshots.map((r) =>
          logAcaoCritica({
            acao: "exclusao_logica",
            modulo: "Pagamentos Diversos",
            tabela: "pagamentos_diversos",
            registro_id: r.id,
            descricao: `Exclusão de lançamento — ${r.empresa ?? "sem empresa"} · ${r.descricao_pagamento ?? "sem descrição"} · ${brl(r.valor_lg)}`,
            metadata: {
              excluido_em: new Date().toISOString(),
              usuario: data.colaboradorNome,
              usuario_id: data.userId,
              empresa: r.empresa,
              banco: r.banco,
              data_credito: r.data_credito,
              competencia: r.competencia,
              valor_lg: r.valor_lg,
              descricao_pagamento: r.descricao_pagamento,
            },
            severidade: "critico",
          })
        )
      );
    }

    return { success: true, count: data.ids.length };
  });
