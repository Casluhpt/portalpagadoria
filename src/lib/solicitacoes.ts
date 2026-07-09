import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SolicitacaoTipo = Database["public"]["Enums"]["solicitacao_tipo"];
export type SolicitacaoStatus = Database["public"]["Enums"]["solicitacao_status"];
export type Solicitacao = Database["public"]["Tables"]["solicitacoes"]["Row"];
export type SolicitacaoUpdate = Database["public"]["Tables"]["solicitacao_updates"]["Row"];

export const TIPO_LABEL: Record<SolicitacaoTipo, string> = {
  pagamento_diverso: "Pagamento Diverso",
  provisao: "Provisão",
  holerite: "Holerite",
  ferias: "Férias",
  rescisao: "Rescisão",
  outro: "Outro",
};

export const STATUS_LABEL: Record<SolicitacaoStatus, string> = {
  aberta: "Aberta",
  em_analise: "Em análise",
  respondida: "Respondida",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const STATUS_CLASS: Record<SolicitacaoStatus, string> = {
  aberta: "bg-blue-100 text-blue-700 border-blue-200",
  em_analise: "bg-amber-100 text-amber-700 border-amber-200",
  respondida: "bg-violet-100 text-violet-700 border-violet-200",
  concluida: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelada: "bg-slate-200 text-slate-600 border-slate-300",
};

export async function criarSolicitacao(input: {
  solicitante_nome: string;
  solicitante_email: string;
  tipo: SolicitacaoTipo;
  assunto: string;
  descricao: string;
}) {
  const { data, error } = await supabase
    .from("solicitacoes")
    .insert({ ...input, codigo: "" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listarPorEmail(email: string) {
  const { data, error } = await supabase
    .from("solicitacoes")
    .select("*")
    .ilike("solicitante_email", email.trim())
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function obterSolicitacao(id: string) {
  const { data, error } = await supabase
    .from("solicitacoes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listarUpdates(solicitacaoId: string) {
  const { data, error } = await supabase
    .from("solicitacao_updates")
    .select("*")
    .eq("solicitacao_id", solicitacaoId)
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function comentarComoSolicitante(input: {
  solicitacao_id: string;
  autor_nome: string;
  autor_email: string;
  mensagem: string;
}) {
  const { data, error } = await supabase
    .from("solicitacao_updates")
    .insert({
      solicitacao_id: input.solicitacao_id,
      autor_tipo: "solicitante",
      autor_nome: input.autor_nome,
      autor_email: input.autor_email,
      mensagem: input.mensagem,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
