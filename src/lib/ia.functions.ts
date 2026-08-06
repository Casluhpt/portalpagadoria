import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AskInput = z.object({
  pergunta: z.string().min(2).max(1000),
  contexto: z.string().max(100_000).default(""),
  appState: z.any().optional(),
});

/**
 * IA da Pagadoria desativada conforme auditoria v2.6.8.
 * O chatbot foi removido, mas o endpoint é mantido para evitar erros em possíveis chamadas órfãs.
 */
export const perguntarIa = createServerFn({ method: "POST" })
  .validator((data: unknown) => AskInput.parse(data))
  .handler(async () => {
    return { 
      resposta: null, 
      erro: "O serviço de IA Assistente foi desativado pela administração (v2.6.8)." 
    };
  });
