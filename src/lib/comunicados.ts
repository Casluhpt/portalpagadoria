import { supabase } from "@/integrations/supabase/client";

export type Comunicado = {
  id: string;
  titulo: string;
  mensagem: string;
  criado_em: string;
  criado_por: string | null;
  lido: boolean;
};

export const comunicadosQueryKey = ["comunicados"] as const;

export async function fetchComunicados(userId: string | undefined): Promise<Comunicado[]> {
  const { data, error } = await supabase
    .from("comunicados")
    .select("id, titulo, mensagem, criado_em, criado_por")
    .order("criado_em", { ascending: false })
    .limit(100);
  if (error) throw error;

  let lidos = new Set<string>();
  if (userId) {
    const { data: leituras, error: e2 } = await supabase
      .from("comunicado_leituras")
      .select("comunicado_id")
      .eq("user_id", userId);
    if (e2) throw e2;
    lidos = new Set((leituras ?? []).map((l) => l.comunicado_id));
  }
  return (data ?? []).map((c) => ({ ...c, lido: lidos.has(c.id) }));
}

export async function marcarLido(comunicadoId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("comunicado_leituras")
    .upsert({ comunicado_id: comunicadoId, user_id: userId }, { onConflict: "comunicado_id,user_id" });
  if (error) throw error;
}

export async function marcarTodosLidos(ids: string[], userId: string): Promise<void> {
  if (ids.length === 0) return;
  const rows = ids.map((id) => ({ comunicado_id: id, user_id: userId }));
  const { error } = await supabase
    .from("comunicado_leituras")
    .upsert(rows, { onConflict: "comunicado_id,user_id" });
  if (error) throw error;
}

export async function excluirComunicadosPermanente(ids: string[], userId: string): Promise<void> {
  if (ids.length === 0) return;
  // Na nossa arquitetura de comunicados globais, "excluir" para o usuário 
  // significa marcar como lido e ocultar da sua visão pessoal.
  // Se o usuário for admin e quiser apagar a mensagem global, precisaríamos de outra permissão.
  // Por enquanto, vamos tratar como exclusão da visualização do usuário (marcar como lido definitivamente).
  await marcarTodosLidos(ids, userId);
}

export async function publicarComunicado(
  titulo: string,
  mensagem: string,
  userId: string,
  canal: "portal" | "email" | "ambos" = "portal",
): Promise<void> {
  const { error } = await supabase
    .from("comunicados")
    .insert({ titulo, mensagem, criado_por: userId, canal });
  if (error) throw error;
}
