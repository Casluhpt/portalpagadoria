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
  .validator((data: unknown) => AskInput.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    
    console.log("[IA] Iniciando consulta:", {
      pergunta: data.pergunta.substring(0, 50) + "...",
      hasContexto: !!data.contexto,
      hasKey: !!key
    });

    if (!key) {
      console.error("[IA] Erro: LOVABLE_API_KEY não encontrada no ambiente.");
      return { 
        resposta: null, 
        erro: "IA de Suporte da Pagadoria: A chave de integração não está configurada corretamente no servidor." 
      };
    }

    try {
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
        const detalhe = await res.text().catch(() => "Sem detalhes do corpo");
        console.error(`[IA] Falha no Gateway (Status: ${res.status}):`, detalhe);
        
        if (res.status === 429) {
          return { resposta: null, erro: "IA de Suporte da Pagadoria: O serviço está temporariamente sobrecarregado (429). Tente novamente em instantes." };
        }
        if (res.status === 402) {
          return { resposta: null, erro: "IA de Suporte da Pagadoria: Limite de créditos atingido (402). Contate o administrador lucas.chaves.lc2001@gmail.com." };
        }
        
        return { 
          resposta: null, 
          erro: `IA de Suporte da Pagadoria: Erro técnico na comunicação (${res.status}). O incidente foi registrado para análise.` 
        };
      }

      let texto = "";
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const lines = part.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const evt = JSON.parse(payload);
              const delta = evt.choices?.[0]?.delta?.content || 
                            evt.delta || 
                            (evt.type === "response.output_text.delta" ? evt.delta : "") ||
                            (evt.type === "response.completed" ? evt.response?.output_text : "") ||
                            "";
              texto += delta;
            } catch {
              /* ignora eventos parciais */
            }
          }
        }
      }

      if (!texto.trim()) {
        return {
          resposta: "Não encontrei material autorizado suficiente para responder com segurança. Abra um chamado em **Configurações > Canal de Suporte Técnico**.",
          erro: null,
        };
      }

      return { resposta: texto.trim(), erro: null };

    } catch (err) {
      console.error("[IA] Erro crítico na operação:", err);
      return { 
        resposta: null, 
        erro: "IA de Suporte da Pagadoria: Falha técnica de rede ou processamento de stream. Tente novamente." 
      };
    }
  });
