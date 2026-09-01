import { defaultV290Automations, buildProvisionSyncPatch, PAGAMENTOS_DIVERSOS_SYNC_FIELDS, removeConfirmedDuplicates, type V290Automation } from "./v290-core.functions";

export const V290_VERSION = "2.9.0";

/** Registro único das capacidades da v2.9.0 para os módulos existentes. */
export const V290_CAPABILITIES = {
  importacaoAdaptativa: true,
  duplicidade: true,
  sincronizacaoPagamentosProvisao: true,
  conciliacaoDetalhada: true,
  historicoFechamentos: true,
  auditoriaRastreavel: true,
  automacoesOptIn: true,
  feedbackProcessamento: true,
} as const;

export const V290_VERSION_ENTRY = {
  version: V290_VERSION,
  type: "Melhoria / Implementação",
  team: "Equipe Pagadoria",
  highlight: "Integração consolidada da importação adaptativa, conciliação e fluxos operacionais.",
  categories: ["Novo", "Melhoria", "Correção"],
  highlights: [
    "Remodelagem do motor de Conciliação Bancária existente",
    "Importação inteligente e adaptativa",
    "Sincronização Pagamentos Diversos → Provisão Diária",
    "Normalização e tratamento de documentos processados mais de uma vez",
    "Histórico de Fechamentos",
    "Automações Inteligentes configuráveis",
    "Melhorias de feedback e processamento",
  ],
};

export function getV290Automations(): V290Automation[] {
  return defaultV290Automations.map((automation) => ({ ...automation }));
}

export function applyProvisionSync(record: Record<string, unknown>) {
  return buildProvisionSyncPatch(record);
}

export function getProvisionSyncFields() {
  return [...PAGAMENTOS_DIVERSOS_SYNC_FIELDS];
}

export function normalizeImportedRows<T extends Record<string, unknown>>(rows: T[]) {
  return removeConfirmedDuplicates(rows);
}
