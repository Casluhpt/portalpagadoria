import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Fechamento de competência de Pagamentos Diversos.
 *
 * Operação destrutiva (limpa a base) — exige sessão válida e papel de
 * administrador validado no servidor. O usuário é sempre derivado do token,
 * nunca do payload enviado pelo cliente.
 */
export const fecharCompetenciaPagamentosFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({
    nome: z.string(),
    registros: z.array(z.any()),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "administrador",
    });
    if (roleError) throw new Error("Falha ao validar permissão");
    if (!isAdmin) throw new Error("Acesso restrito a administradores");

    const usuarioId = context.userId;

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
        usuario_id: usuarioId,
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
        usuarioId
      );
    } catch (e) {
      console.error("Falha ao enviar notificação de fechamento:", e);
    }

    return { success: true };
  });
