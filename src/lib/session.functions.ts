import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

/**
 * Registra a sessão atual e remove quaisquer sessões anteriores do mesmo usuário,
 * garantindo a política de sessão única.
 */
export const registrarSessaoUnica = createServerFn({ method: "POST" })
  .validator((data) => z.object({
    sessionId: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabase.rpc('registrar_sessao_e_limpar_anteriores', {
      _session_id: data.sessionId
    });

    if (error) throw new Error(error.message);
    return { success: true };
  });

/**
 * Verifica se a sessão atual ainda é válida (não foi derrubada por outro login).
 */
export const verificarSessaoAtiva = createServerFn({ method: "GET" })
  .validator((data) => z.object({
    sessionId: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('session_id', data.sessionId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    
    // Se não encontrou registro com esse session_id, a sessão foi invalidada
    return { valida: !!session };
  });

/**
 * Heartbeat para manter a sessão ativa na tabela user_sessions.
 */
export const heartbeatSessao = createServerFn({ method: "POST" })
  .validator((data) => z.object({
    sessionId: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from('user_sessions')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('session_id', data.sessionId);

    if (error) throw new Error(error.message);
    return { success: true };
  });
