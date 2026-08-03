import { supabase } from "@/integrations/supabase/client";

/** Ações críticas registradas obrigatoriamente na trilha de auditoria. */
export const ACOES_CRITICAS = {
  criacao_competencia: "Criação de competência",
  fechamento_competencia: "Fechamento de competência",
  arquivamento_competencia: "Arquivamento de competência",
  reabertura_competencia: "Reabertura de competência",
  edicao_pos_fechamento: "Edição administrativa após fechamento",
  exclusao_logica: "Exclusão lógica",
  restauracao_registro: "Restauração de registro",
  alteracao_permissao: "Alteração de permissão",
  importacao_excel: "Importação de Excel",
  exportacao_relatorio: "Exportação de relatório",
  acesso_negado: "Acesso negado a área restrita",
  tentativa_login_admin: "Tentativa de login administrativo",
  alteracao_parametros: "Alteração em parâmetros",
  integracao_provisao: "Integração automática com a Base da Provisão Diária",
  ajuste_manual_provisao: "Ajuste manual em dado integrado da provisão",
  entrada_fila: "Entrada na fila virtual",
  saida_fila: "Saída voluntária da fila virtual",
} as const;

export type AcaoCritica = keyof typeof ACOES_CRITICAS;

export type AuditLogRow = {
  id: string;
  acao: string;
  modulo: string | null;
  tabela: string | null;
  registro_id: string | null;
  descricao: string | null;
  justificativa: string | null;
  snapshot: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  severidade: string;
  user_id: string | null;
  user_nome: string | null;
  user_email: string | null;
  created_at: string;
};

export type LogParams = {
  acao: AcaoCritica;
  modulo?: string;
  tabela?: string;
  registro_id?: string;
  descricao?: string;
  justificativa?: string;
  snapshot?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  severidade?: "info" | "alerta" | "critico";
};

/**
 * Registra uma ação crítica. Nunca lança — falha de log não deve
 * interromper a operação do usuário, mas é reportada no console.
 */
export async function logAcaoCritica(params: LogParams): Promise<void> {
  try {
    const { error } = await (supabase as any).rpc("registrar_acao_critica", {
      _acao: params.acao,
      _modulo: params.modulo ?? null,
      _tabela: params.tabela ?? null,
      _registro_id: params.registro_id ?? null,
      _descricao: params.descricao ?? ACOES_CRITICAS[params.acao],
      _justificativa: params.justificativa ?? null,
      _snapshot: params.snapshot ?? null,
      _metadata: params.metadata ?? null,
      _severidade: params.severidade ?? "info",
    });
    if (error) console.warn("[audit] falha ao registrar ação crítica", error.message);
  } catch (e) {
    console.warn("[audit] falha ao registrar ação crítica", e);
  }
}

export async function fetchAuditCritico(): Promise<AuditLogRow[]> {
  const { data, error } = await (supabase as any)
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as AuditLogRow[];
}

/** Restauração de registro excluído logicamente — exclusiva do Administrador. */
export async function restaurarRegistro(
  tabela: string,
  id: string,
  justificativa: string,
): Promise<void> {
  const { error } = await (supabase as any).rpc("restaurar_registro", {
    _tabela: tabela,
    _id: id,
    _justificativa: justificativa,
  });
  if (error) throw new Error(error.message);
}
