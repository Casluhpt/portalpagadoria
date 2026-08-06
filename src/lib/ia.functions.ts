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

CONDIÇÕES DE OPERAÇÃO E SEGURANÇA (RBAC):
1. RESPEITO INTEGRAL ÀS PERMISSÕES: Você conhece o contexto do usuário (setor, permissões e módulos permitidos). 
2. NUNCA forneça informações ou oriente sobre módulos aos quais o usuário NÃO tem acesso na lista "allowedModules".
3. Se o usuário tentar acessar algo proibido, diga educadamente que ele não tem permissão para essa área e deve falar com o administrador (lucas.chaves.lc2001@gmail.com).
4. CONTEXTUALIZAÇÃO: Use o "currentPath" e "appState" para entender onde o usuário está e oferecer ajuda específica daquela tela.

REGRAS DE RESPOSTA:
1. Responda SOMENTE com base no material de apoio e módulos do portal.
2. Seja humanizada: Use saudações cordiais e responda de forma natural.
3. DIRECIONAMENTO INTELIGENTE: Indique o caminho ou use LINKS DE AÇÃO entre colchetes, ex: [Pagamentos Diversos].
4. Se não souber, recomende abrir um chamado em Configurações > Canal de Suporte Técnico.
5. NUNCA invente dados sensíveis ou financeiros.
6. CONHECIMENTO DO PORTAL: Você entende de Provisão Diária, Pagamentos Diversos, eSocial, Conciliação, Despesas Fixas, Fila Virtual e Auditoria.`;

export const perguntarIa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => AskInput.parse(data))
  .handler(async ({ data, context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    const { userId, supabase } = context;

    console.log("[IA] Request handler started for user:", userId);

    if (!key) {
      console.error("[IA] LOVABLE_API_KEY is missing");
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
        { 
          role: "system", 
          content: `${SYSTEM}${patterns ? `\nPadrões de Aprendizado do Usuário: ${JSON.stringify(patterns.patterns)}` : ""}${data.appState ? `\nCONTEXTO DO APP:\n${JSON.stringify(data.appState)}` : ""}` 
        },
        ...(historico?.reverse().map((h: any) => ({ role: h.role, content: h.content })) || []),
        {
          role: "user",
          content: `CONTEXTO ATUAL (DOCUMENTAÇÃO/MATERIAL DE APOIO):\n${data.contexto || "Sem material direto"}\n\nPERGUNTA DO USUÁRIO:\n${data.pergunta}`,
        },
      ];

      // 3. Chamada à IA
      const res = await fetch("https://api.lovable.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-5",
          messages: messages,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[IA] Gateway error: ${res.status}`, errorText);
        throw new Error(`Gateway error: ${res.status}`);
      }

      const result = await res.json();
      console.log("[IA] Gateway response raw:", JSON.stringify(result));
      const resposta = result.output || result.choices?.[0]?.message?.content || result.output_text || "";

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
