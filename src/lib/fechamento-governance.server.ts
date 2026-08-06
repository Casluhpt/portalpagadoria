import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "administrador",
  });
  if (error) throw new Error("Falha ao validar permissão");
  if (!data) throw new Error("Acesso restrito a administradores");
}

export async function processUpdateFechamento(params: {
  id: string;
  nome: string;
  userId: string;
  supabase: any;
}) {
  const { id, nome, userId, supabase } = params;
  await assertAdmin(supabase, userId);

  const { data: anterior } = await supabaseAdmin
    .from("fechamento_pagamentos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from("fechamento_pagamentos")
    .update({ nome })
    .eq("id", id);

  if (error) throw error;

  await supabase.rpc("registrar_acao_critica", {
    _acao: "edicao_fechamento",
    _modulo: "Fechamento de Competência",
    _tabela: "fechamento_pagamentos",
    _registro_id: id,
    _descricao: `Renomeação do fechamento para "${nome}"`,
    _snapshot: anterior ?? null,
    _metadata: { novo_nome: nome },
    _severidade: "alerta",
  });

  return { success: true };
}

export async function processReabrirCompetencia(params: {
  id: string;
  justificativa: string;
  userId: string;
  supabase: any;
}) {
  const { id, justificativa, userId, supabase } = params;
  await assertAdmin(supabase, userId);

  const { data: anterior } = await supabaseAdmin
    .from("fechamento_pagamentos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from("fechamento_pagamentos")
    .delete()
    .eq("id", id);

  if (error) throw error;

  await supabase.rpc("registrar_acao_critica", {
    _acao: "reabertura_competencia",
    _modulo: "Fechamento de Competência",
    _tabela: "fechamento_pagamentos",
    _registro_id: id,
    _descricao: "Reabertura (exclusão) de fechamento de competência",
    _justificativa: justificativa,
    _snapshot: anterior ?? null,
    _severidade: "critico",
  });

  return { success: true };
}
