import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { processUpdateFechamento, processReabrirCompetencia } from "./fechamento-governance.server";

export const updateFechamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    id: z.string().uuid(),
    nome: z.string().min(3).max(200),
  }))
  .handler(async ({ data, context }) => {
    return processUpdateFechamento({
      ...data,
      userId: context.userId,
      supabase: context.supabase
    });
  });

export const reabrirCompetencia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    id: z.string().uuid(),
    justificativa: z.string().min(10).max(1000),
  }))
  .handler(async ({ data, context }) => {
    return processReabrirCompetencia({
      ...data,
      userId: context.userId,
      supabase: context.supabase
    });
  });
