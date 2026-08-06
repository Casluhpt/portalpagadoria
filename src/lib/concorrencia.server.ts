import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function processEntrarFila(data: {
  userId: string;
  userNome: string;
  modulo: string;
  sessionId?: string;
}) {
  // Check if user already in queue
  const { data: existing } = await supabaseAdmin
    .from('concorrencia_fila')
    .select('id, status, entrou_em')
    .eq('user_id', data.userId)
    .eq('modulo', data.modulo)
    .maybeSingle();

  if (existing) return existing;

  // Check if queue is empty for this module
  const { count } = await supabaseAdmin
    .from('concorrencia_fila')
    .select('id', { count: 'exact', head: true })
    .eq('modulo', data.modulo);

  const status = count === 0 ? 'ativo' : 'aguardando';
  const ativo_desde = status === 'ativo' ? new Date().toISOString() : null;

  const { data: inserted, error } = await supabaseAdmin
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
}

export async function processSairFila(data: {
  userId: string;
  modulo: string;
}) {
  const { data: leavingUser } = await supabaseAdmin
    .from('concorrencia_fila')
    .select('status')
    .eq('user_id', data.userId)
    .eq('modulo', data.modulo)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from('concorrencia_fila')
    .delete()
    .eq('user_id', data.userId)
    .eq('modulo', data.modulo);

  if (error) throw new Error(error.message);

  // If the person leaving was the active one, promote the next person
  if (leavingUser?.status === 'ativo') {
    const { data: next } = await supabaseAdmin
      .from('concorrencia_fila')
      .select('id')
      .eq('modulo', data.modulo)
      .eq('status', 'aguardando')
      .order('entrou_em', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (next) {
      await supabaseAdmin
        .from('concorrencia_fila')
        .update({ status: 'ativo', ativo_desde: new Date().toISOString() })
        .eq('id', next.id);
    }
  }

  return { success: true };
}

export async function processGetFilaStatus(modulo: string) {
  // 1. Clean up "dead" sessions (inactive for more than 45 seconds)
  const threshold = new Date(Date.now() - 45000).toISOString();
  
  const { data: expired } = await supabaseAdmin
    .from('concorrencia_fila')
    .select('user_id, status')
    .eq('modulo', modulo)
    .lt('entrou_em', threshold);

  if (expired && expired.length > 0) {
    const expiredIds = expired.map(e => e.user_id);
    const wasActiveExpired = expired.some(e => e.status === 'ativo');
    
    await supabaseAdmin
      .from('concorrencia_fila')
      .delete()
      .in('user_id', expiredIds)
      .eq('modulo', modulo);
      
    if (wasActiveExpired) {
      const { data: next } = await supabaseAdmin
        .from('concorrencia_fila')
        .select('id')
        .eq('modulo', modulo)
        .eq('status', 'aguardando')
        .order('entrou_em', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (next) {
        await supabaseAdmin
          .from('concorrencia_fila')
          .update({ status: 'ativo', ativo_desde: new Date().toISOString() })
          .eq('id', next.id);
      }
    }
  }
  
  const { data: queue, error } = await supabaseAdmin
    .from('concorrencia_fila')
    .select('*')
    .eq('modulo', modulo)
    .order('entrou_em', { ascending: true });

  if (error) throw new Error(error.message);
  return queue;
}

export async function processHeartbeatFila(data: {
  userId: string;
  modulo: string;
  sessionId?: string;
}) {
  const { data: current } = await supabaseAdmin
    .from('concorrencia_fila')
    .select('session_id')
    .eq('user_id', data.userId)
    .eq('modulo', data.modulo)
    .maybeSingle();

  if (current && data.sessionId && current.session_id !== data.sessionId) {
    throw new Error("Sessão inválida ou duplicada detectada.");
  }

  const { error } = await supabaseAdmin
    .from('concorrencia_fila')
    .update({ entrou_em: new Date().toISOString() })
    .eq('user_id', data.userId)
    .eq('modulo', data.modulo);
    
  if (error) throw new Error(error.message);
  return { success: true };
}
