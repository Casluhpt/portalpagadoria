import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AskInput = z.object({
  pergunta: z.string().min(2).max(1000),
  contexto: z.string().max(100_000).default(""),
  appState: z.object({
    currentPath: z.string(),
    setor: z.string().optional(),
    roles: z.array(z.string()).default([]),
    allowedModules: z.array(z.string()).default([]),
  }).optional(),
});

// Prompt humanizado e focado em aprendizado
const SYSTEM = `Você é a IA Assistente Humanizada do Portal da Pagadoria (Profarma).
Personalidade: Atenciosa, profissional, empática e proativa.

Regras de Comportamento e Direcionamento:
1. Responda SOMENTE com base no material de apoio e módulos do portal.
2. Seja humanizada: Use saudações cordiais, entenda o sentimento do usuário e responda de forma natural.
3. DIRECIOMANENTO INTELIGENTE: Sempre que identificar que a resposta está em um material de apoio específico ou em um módulo do portal, indique claramente o caminho.
4. LINKS DE AÇÃO: Você deve sugerir ao usuário que clique em botões ou navegue até áreas como "Pagamentos Diversos", "Provisão Diária", "Conciliação Bancária" ou "Material de Apoio".
5. Se o usuário perguntar "onde encontro X" ou "como faço Y", e você tiver a informação, responda e adicione: "Você pode acessar diretamente o módulo [Nome do Módulo] no menu lateral."
6. Se não souber, diga: "Ainda não tenho essa informação nos meus manuais autorizados. Para sua segurança, recomendo abrir um chamado em Configurações > Canal de Suporte Técnico."
7. NUNCA invente dados sensíveis ou financeiros.
8. Considere o histórico e padrões do usuário para ser mais assertiva.`;

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
      // 1. Buscar histórico recente e padrões de aprendizado
      const { data: historico } = await supabase
        .from("ia_conversas")
        .select("role, content")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(6);

      const { data: patterns } = await supabase
        .from("ia_user_patterns")
        .select("patterns")
        .eq("user_id", userId)
        .single();

      // 2. Construir mensagens para o GPT
      const messages = [
        { role: "system", content: SYSTEM + (patterns ? `\nPadrões de Aprendizado do Usuário: ${JSON.stringify(patterns.patterns)}` : "") },
        ...(historico?.reverse().map((h: any) => ({ role: h.role, content: h.content })) || []),
        {
          role: "user",
          content: `CONTEXTO ATUAL (MATERIAL DE APOIO):\n${data.contexto || "Sem material direto"}\n\nPERGUNTA ATUAL:\n${data.pergunta}`,
        },
      ];

      // 3. Chamada à IA
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({
          model: "openai/gpt-4o",
          input: messages,
        }),
      });

      if (!res.ok) {
        throw new Error(`Gateway error: ${res.status}`);
      }

      const result = await res.json();
      const resposta = result.choices?.[0]?.message?.content || result.output_text || "";

      if (!resposta) {
        return { resposta: "Desculpe, tive uma instabilidade momentânea. Pode repetir?", erro: null };
      }

      // 4. Salvar histórico e processar aprendizado em background
      await Promise.all([
        supabase.from("ia_conversas").insert([
          { user_id: userId, role: "user", content: data.pergunta },
          { user_id: userId, role: "assistant", content: resposta }
        ]),
        // Atualiza padrões se a pergunta indicar preferências (ex: "prefiro tabelas", "me chame de Sr.")
        (async () => {
          if (data.pergunta.length > 10) {
             const currentPatterns = (patterns?.patterns as Record<string, any>) || {};
             const temas = (currentPatterns.temas_frequentes as string[]) || [];
             
             if (data.pergunta.toLowerCase().includes("ajuda com") || data.pergunta.toLowerCase().includes("como fazer")) {
                currentPatterns.temas_frequentes = [...temas, data.pergunta.substring(0, 30)].slice(-5);
                await supabase.from("ia_user_patterns").upsert({ user_id: userId, patterns: currentPatterns });
             }
          }
        })()
      ]);

      return { resposta, erro: null };

    } catch (err) {
      console.error("[IA] Erro:", err);
      return { 
        resposta: null, 
        erro: "IA de Suporte da Pagadoria: Não consegui processar sua solicitação agora. Tente em alguns segundos." 
      };
    }
  });
