import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AskInput = z.object({
  pergunta: z.string().min(2).max(1000),
  contexto: z.string().max(60_000).default(""),
});

const SYSTEM = `Você é a IA Assistente do Portal da Pagadoria (Profarma).
Regras obrigatórias:
- Responda SOMENTE com base no material de apoio autorizado e nas informações do portal fornecidas no contexto.
- Se a resposta não estiver no material, diga claramente que não há material autorizado sobre o tema e sugira abrir um chamado em Configurações > Canal de Suporte Técnico.
- Nunca invente valores, números de registro, matrículas, nomes de colaboradores ou dados financeiros.
- Responda em português do Brasil, de forma objetiva, em no máximo 200 palavras, usando markdown simples (títulos curtos, listas e negrito).
- Sempre que possível indique o módulo do portal onde a ação é feita (ex.: Pagamentos Diversos, Provisão Diária, Conciliação Bancária).`;

export const perguntarIa = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => AskInput.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) {
      return { resposta: null, erro: "Assistente indisponível: chave de IA não configurada." };
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        stream: true,
        input: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `MATERIAL DE APOIO AUTORIZADO E MÓDULOS DO PORTAL:\n${data.contexto || "(nenhum material cadastrado)"}\n\nPERGUNTA DO USUÁRIO:\n${data.pergunta}`,
          },
        ],
      }),
    });

    if (!res.ok || !res.body) {
      const detalhe = await res.text().catch(() => "");
      if (res.status === 429) {
        return { resposta: null, erro: "Muitas solicitações à IA no momento. Tente novamente em instantes." };
      }
      if (res.status === 402) {
        return { resposta: null, erro: "Os créditos de IA do portal foram esgotados. Fale com o administrador." };
      }
      console.error("Falha na IA Assistente", res.status, detalhe);
      return { resposta: null, erro: "Não foi possível consultar a IA Assistente agora." };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let texto = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        for (const line of part.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload) as {
              type?: string;
              delta?: string;
              response?: { output_text?: string };
            };
            if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
              texto += evt.delta;
            } else if (evt.type === "response.completed" && !texto && evt.response?.output_text) {
              texto = evt.response.output_text;
            }
          } catch {
            /* ignora eventos parciais */
          }
        }
      }
    }

    if (!texto.trim()) {
      return {
        resposta:
          "Não encontrei material autorizado suficiente para responder com segurança. Abra um chamado em **Configurações > Canal de Suporte Técnico**.",
        erro: null,
      };
    }

    return { resposta: texto.trim(), erro: null };
  });
