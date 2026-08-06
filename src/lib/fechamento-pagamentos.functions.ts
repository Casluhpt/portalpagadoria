import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const fecharCompetenciaPagamentosFn = createServerFn({ method: "POST" })
  .validator((data) => z.object({
    nome: z.string(),
    usuarioId: z.string(),
    registros: z.array(z.any()),
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { format } = await import("date-fns");

    const totalValor = data.registros.reduce((sum, r) => sum + (Number(r.valor_lg) || 0), 0);
    const totalRegistros = data.registros.length;
    const now = new Date();
    const mes = format(now, "yyyy-MM");
    const ano = format(now, "yyyy");

    // 1. Record the closure using Admin client to bypass RLS and ensure integrity
    const { error: insertError } = await supabaseAdmin
      .from("fechamento_pagamentos")
      .insert({
        nome: data.nome,
        mes,
        ano,
        usuario_id: data.usuarioId,
        total_valor: totalValor,
        total_registros: totalRegistros
      });
    
    if (insertError) throw new Error("Erro ao registrar fechamento: " + insertError.message);

    // 2. Clear the main table using Admin client
    const { error: deleteError } = await supabaseAdmin
      .from("pagamentos_diversos")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) throw new Error("Erro ao limpar base: " + deleteError.message);

    // 3. Notify the user via internal notification system
    try {
      const { notificarArquivoPronto } = await import("./notificacoes-arquivos");
      await notificarArquivoPronto(
        `Fechamento Concluído: ${data.nome}`,
        `O fechamento da competência ${mes} foi realizado com sucesso.`,
        data.usuarioId
      );
    } catch (e) {
      console.error("Falha ao enviar notificação de fechamento:", e);
    }

    return { success: true };
  });
