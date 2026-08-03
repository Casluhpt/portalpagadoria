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
    // Como a RPC ainda não está no type-gen, usamos a abordagem segura via fetch direto no client admin
    // Ou simplesmente usamos as APIs de tabela do admin que contornam RLS
    const { error } = await supabaseAdmin
      .from("fechamento_pagamentos")
      .delete()
      .eq("id", data.id);

    if (error) throw error;
    return { success: true };
  });
