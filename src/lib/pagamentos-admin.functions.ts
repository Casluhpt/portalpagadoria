import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Exclusão lógica em massa de Pagamentos Diversos.
 *
 * Exige sessão válida e papel de administrador validado no servidor.
 * A identidade registrada na auditoria vem sempre do token — nunca do payload,
 * para que o registro de auditoria não possa ser forjado pelo cliente.
 */
export const purgarPagamentosBulkFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({
    ids: z.array(z.string()),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "administrador",
    });
    if (roleError) throw new Error("Falha ao validar permissão");
    if (!isAdmin) throw new Error("Acesso restrito a administradores");

    const userId = context.userId;

    // Nome do responsável derivado do banco, não do cliente.
    const { data: perfil } = await context.supabase
      .from("profiles")
      .select("nome, email")
      .eq("id", userId)
      .maybeSingle();
    const colaboradorNome = perfil?.nome ?? perfil?.email ?? userId;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { logAcaoCritica } = await import("./audit-critico");

    // Fetch snapshots for audit BEFORE deletion
    const { data: snapshots, error: fetchError } = await supabaseAdmin
      .from("pagamentos_diversos")
      .select("*")
      .in("id", data.ids);

    if (fetchError) throw new Error("Erro ao buscar registros para auditoria: " + fetchError.message);

    // Perform logical deletion by setting excluido_em
    const { error: deleteError } = await supabaseAdmin
      .from("pagamentos_diversos")
      .update({
        excluido_em: new Date().toISOString(),
        excluido_por: userId
      } as any)
      .in("id", data.ids);

    if (deleteError) throw new Error("Erro ao excluir registros: " + deleteError.message);

    // Log the action for each record
    if (snapshots) {
      const brl = (n: number | null | undefined) =>
        n == null ? "" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

      await Promise.all([
        ...snapshots.map((r) =>
          logAcaoCritica({
            acao: "exclusao_logica",
            modulo: "Pagamentos Diversos",
            tabela: "pagamentos_diversos",
            registro_id: r.id,
            descricao: `Exclusão de lançamento — ${r.empresa ?? "sem empresa"} · ${r.descricao_pagamento ?? "sem descrição"} · ${brl(r.valor_lg)}`,
            metadata: {
              excluido_em: new Date().toISOString(),
              usuario: colaboradorNome,
              usuario_id: userId,
              empresa: r.empresa,
              banco: r.banco,
              data_credito: r.data_credito,
              competencia: r.competencia,
              valor_lg: r.valor_lg,
              descricao_pagamento: r.descricao_pagamento,
            },
            severidade: "critico",
          })
        ),
        // Record in pagamentos_audit with acao = DELETE for Registros Excluidos module
        ...snapshots.map((r) =>
          supabaseAdmin.from("pagamentos_audit" as any).insert({
            pagamento_id: r.id,
            user_id: userId,
            user_nome: colaboradorNome,
            acao: 'DELETE',
            snapshot: r,
            alterado_em: new Date().toISOString(),
            created_at: new Date().toISOString()
          })
        )
      ]);
    }

    return { success: true, count: data.ids.length };
  });
