import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const sendSupportRequest = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    assunto: z.enum(['Bug e Correção', 'Erro', 'Melhoria']),
    anexo_url: z.string().optional(),
    comentario: z.string().optional(),
    user_id: z.string(),
    user_nome: z.string(),
    user_email: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from('suporte_tecnico')
      .insert({
        assunto: data.assunto,
        anexo_url: data.anexo_url,
        comentario: data.comentario,
        user_id: data.user_id,
        user_nome: data.user_nome,
        user_email: data.user_email,
      });

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const listSupportRequests = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from('suporte_tecnico')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  });
