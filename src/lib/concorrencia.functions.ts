import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const entrarFila = createServerFn({ method: "POST" })
  .validator((data) => z.object({
    userId: z.string(),
    userNome: z.string(),
    modulo: z.string(),
    sessionId: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    // Check if user already in queue
    const { data: existing } = await supabase
      .from('concorrencia_fila')
      .select('id, status, entrou_em')
      .eq('user_id', data.userId)
      .eq('modulo', data.modulo)
      .maybeSingle();

    if (existing) return existing;

    // Check if queue is empty for this module
    const { count } = await supabase
      .from('concorrencia_fila')
      .select('id', { count: 'exact', head: true })
      .eq('modulo', data.modulo);

    const status = count === 0 ? 'ativo' : 'aguardando';
    const ativo_desde = status === 'ativo' ? new Date().toISOString() : null;

    const { data: inserted, error } = await supabase
      .from('concorrencia_fila')
      .insert({
        user_id: data.userId,
        user_nome: data.userNome,
        modulo: data.modulo,
        status,
        ativo_desde,
        session_id: data.sessionId
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return inserted;
  });

export const sairFila = createServerFn({ method: "POST" })
  .validator((data) => z.object({
    userId: z.string(),
    modulo: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { data: leavingUser } = await supabase
      .from('concorrencia_fila')
      .select('status')
      .eq('user_id', data.userId)
      .eq('modulo', data.modulo)
      .maybeSingle();

    const { error } = await supabase
      .from('concorrencia_fila')
      .delete()
      .eq('user_id', data.userId)
      .eq('modulo', data.modulo);

    if (error) throw new Error(error.message);

    // If the person leaving was the active one, promote the next person
    if (leavingUser?.status === 'ativo') {
      const { data: next } = await supabase
        .from('concorrencia_fila')
        .select('id')
        .eq('modulo', data.modulo)
        .eq('status', 'aguardando')
        .order('entrou_em', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (next) {
        await supabase
          .from('concorrencia_fila')
          .update({ status: 'ativo', ativo_desde: new Date().toISOString() })
          .eq('id', next.id);
      }
    }

    return { success: true };
  });

export const getFilaStatus = createServerFn({ method: "GET" })
  .validator((data) => z.object({
    modulo: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    // 1. Clean up "dead" sessions (inactive for more than 45 seconds)
    // Threshold calculation: 45 seconds ago
    const threshold = new Date(Date.now() - 45000).toISOString();
    
    // Find who we're about to remove due to timeout
    const { data: expired } = await supabase
      .from('concorrencia_fila')
      .select('user_id, status')
      .eq('modulo', data.modulo)
      .lt('entrou_em', threshold);

    if (expired && expired.length > 0) {
      const expiredIds = expired.map(e => e.user_id);
      const wasActiveExpired = expired.some(e => e.status === 'ativo');
      
      await supabase
        .from('concorrencia_fila')
        .delete()
        .in('user_id', expiredIds)
        .eq('modulo', data.modulo);
        
      if (wasActiveExpired) {
        // Promote next if active person timed out
        const { data: next } = await supabase
          .from('concorrencia_fila')
          .select('id')
          .eq('modulo', data.modulo)
          .eq('status', 'aguardando')
          .order('entrou_em', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (next) {
          await supabase
            .from('concorrencia_fila')
            .update({ status: 'ativo', ativo_desde: new Date().toISOString() })
            .eq('id', next.id);
        }
      }
    }
    
    const { data: queue, error } = await supabase
      .from('concorrencia_fila')
      .select('*')
      .eq('modulo', data.modulo)
      .order('entrou_em', { ascending: true });

    if (error) throw new Error(error.message);
    return queue;
  });

export const heartbeatFila = createServerFn({ method: "POST" })
  .validator((data) => z.object({
    userId: z.string(),
    modulo: z.string(),
    sessionId: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    // Heartbeat: update 'entrou_em' and ensure session integrity
    const { data: current } = await supabase
      .from('concorrencia_fila')
      .select('session_id')
      .eq('user_id', data.userId)
      .eq('modulo', data.modulo)
      .maybeSingle();

    // If session ID doesn't match, this is a duplicated session or browser
    if (current && data.sessionId && current.session_id !== data.sessionId) {
      throw new Error("Sessão inválida ou duplicada detectada.");
    }

    const { error } = await supabase
      .from('concorrencia_fila')
      .update({ entrou_em: new Date().toISOString() })
      .eq('user_id', data.userId)
      .eq('modulo', data.modulo);
      
    if (error) throw new Error(error.message);
    return { success: true };
  });
