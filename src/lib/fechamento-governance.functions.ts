import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "administrador",
  });
  if (error) throw new Error("Falha ao validar permissão");
  if (!data) throw new Error("Acesso restrito a administradores");
}

export const updateFechamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    id: z.string().uuid(),
    nome: z.string().min(3).max(200),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: anterior } = await supabaseAdmin
      .from("fechamento_pagamentos")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from("fechamento_pagamentos")
      .update({ nome: data.nome })
      .eq("id", data.id);

    if (error) throw error;

    await context.supabase.rpc("registrar_acao_critica", {
      _acao: "edicao_fechamento",
      _modulo: "Fechamento de Competência",
      _tabela: "fechamento_pagamentos",
      _registro_id: data.id,
      _descricao: `Renomeação do fechamento para "${data.nome}"`,
      _snapshot: anterior ?? null,
      _metadata: { novo_nome: data.nome },
      _severidade: "alerta",
    });

    return { success: true };
  });

export const reabrirCompetencia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    id: z.string().uuid(),
    justificativa: z.string().min(10).max(1000),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: anterior } = await supabaseAdmin
      .from("fechamento_pagamentos")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from("fechamento_pagamentos")
      .delete()
      .eq("id", data.id);

    if (error) throw error;

    await context.supabase.rpc("registrar_acao_critica", {
      _acao: "reabertura_competencia",
      _modulo: "Fechamento de Competência",
      _tabela: "fechamento_pagamentos",
      _registro_id: data.id,
      _descricao: "Reabertura (exclusão) de fechamento de competência",
      _justificativa: data.justificativa,
      _snapshot: anterior ?? null,
      _severidade: "critico",
    });

    return { success: true };
  });
