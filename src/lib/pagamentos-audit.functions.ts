import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const getPagamentosAudit = createServerFn({ method: "GET" })
  .inputValidator(z.object({ pagamentoId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const { data: logs, error } = await supabase
      .from("pagamentos_audit" as any)
      .select("*")
      .eq("pagamento_id", data.pagamentoId)
      .order("alterado_em", { ascending: false });
    
    if (error) throw error;
    return logs;
  });
