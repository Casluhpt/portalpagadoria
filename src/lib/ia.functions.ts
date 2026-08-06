import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { processPerguntaIa } from "./ia.server";

const AskInput = z.object({
  pergunta: z.string().min(2).max(1000),
  contexto: z.string().max(60_000).default(""),
});

export const perguntarIa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => AskInput.parse(data))
  .handler(async ({ data, context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    const { userId, supabase } = context;

    if (!key) {
      return { 
        resposta: null, 
        erro: "IA de Suporte da Pagadoria: Falha na configuração de segurança (Chave ausente)." 
      };
    }

    try {
      return await processPerguntaIa({
        userId,
        supabase,
        pergunta: data.pergunta,
        contexto: data.contexto,
        lovableApiKey: key
      });
    } catch (err) {
      console.error("[IA] Erro:", err);
      return { 
        resposta: null, 
        erro: "IA de Suporte da Pagadoria: Não consegui processar sua solicitação agora. Tente em alguns segundos." 
      };
    }
  });
