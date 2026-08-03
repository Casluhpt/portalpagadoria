import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const updateFechamento = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.string().uuid(),
    nome: z.string().min(3),
  }))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("fechamento_pagamentos")
      .update({ nome: data.nome })
      .eq("id", data.id);

    if (error) throw error;
    return { success: true };
  });

export const reabrirCompetencia = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.string().uuid(),
    justificativa: z.string().min(10),
  }))
  .handler(async ({ data }) => {
    // A função has_role é SECURITY DEFINER, então podemos usá-la via rpc ou direto se disponível
    // Mas aqui vamos chamar a RPC que criamos que já tem a trava de role
    const { error } = await supabaseAdmin.rpc('reabrir_competencia_pagamentos', {
      _fechamento_id: data.id,
      _justificativa: data.justificativa
    });

    if (error) throw error;
    return { success: true };
  });
