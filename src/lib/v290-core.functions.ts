export type V290Record = Record<string, unknown>;

export type ConciliacaoStatusV290 =
  | "Conciliado"
  | "Aprovado/Efetivado"
  | "Rejeitado/Devolvido"
  | "Não encontrado"
  | "Diferença de valor"
  | "Diferença de data"
  | "Diferença de empresa/documento"
  | "Ajustado"
  | "Conciliado após ajuste";

export const PAGAMENTOS_DIVERSOS_SYNC_FIELDS = ["data", "empresa", "banco", "valor"] as const;

export function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function normalizeMoney(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const text = String(value ?? "").replace(/R\$|BRL/gi, "").replace(/\s/g, "");
  if (!text) return 0;
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  const number = Number(normalized.replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

export function normalizeDate(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const text = String(value).trim();
  const br = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (br) return `${br[3].length === 2 ? `20${br[3]}` : br[3]}-${String(br[2]).padStart(2, "0")}-${String(br[1]).padStart(2, "0")}`;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString().slice(0, 10);
}

export function duplicateKey(record: V290Record): string {
  const fields = [
    record.documento ?? record.document ?? record.id_documento ?? "",
    record.empresa ?? record.company ?? "",
    record.favorecido ?? record.beneficiario ?? "",
    record.valor ?? record.valor_lg ?? record.amount ?? "",
    record.data ?? record.data_credito ?? record.date ?? "",
    record.banco ?? record.bank ?? "",
    record.descricao ?? record.description ?? "",
  ];
  return fields.map((field, index) => {
    const value = index === 3 ? normalizeMoney(field).toFixed(2) : index === 4 ? normalizeDate(field) : normalizeText(field);
    return value;
  }).join("|");
}

export function removeConfirmedDuplicates<T extends V290Record>(rows: T[]) {
  const seen = new Set<string>();
  const duplicates: T[] = [];
  const unique: T[] = [];
  for (const row of rows) {
    const key = duplicateKey(row);
    if (seen.has(key)) duplicates.push(row);
    else {
      seen.add(key);
      unique.push(row);
    }
  }
  return { unique, duplicates };
}

export function buildProvisionSyncPatch(record: V290Record): V290Record {
  return {
    data: normalizeDate(record.data ?? record.data_credito),
    empresa: record.empresa ?? record.Empresa ?? "",
    banco: record.banco ?? record.Banco ?? "",
    valor: normalizeMoney(record.valor ?? record.valor_lg ?? record.Valor),
  };
}

export function classifyConciliacao(params: {
  hasMatch: boolean;
  sameValue: boolean;
  sameDate: boolean;
  sameIdentity: boolean;
  bankStatus?: string;
  adjusted?: boolean;
}): ConciliacaoStatusV290 {
  if (params.adjusted && params.hasMatch && params.sameValue && params.sameIdentity) return "Conciliado após ajuste";
  const bankStatus = normalizeText(params.bankStatus);
  if (bankStatus.includes("rejeit") || bankStatus.includes("devolv")) return "Rejeitado/Devolvido";
  if (bankStatus.includes("aprov") || bankStatus.includes("efetiv")) {
    if (params.sameValue && params.sameDate && params.sameIdentity) return "Aprovado/Efetivado";
  }
  if (!params.hasMatch) return "Não encontrado";
  if (!params.sameIdentity) return "Diferença de empresa/documento";
  if (!params.sameValue) return "Diferença de valor";
  if (!params.sameDate) return "Diferença de data";
  return "Conciliado";
}

export type V290Automation = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

export const defaultV290Automations: V290Automation[] = [
  { id: "sync-provisao", label: "Sincronização com Provisão Diária", description: "Sincroniza Data, Empresa, Banco e Valor.", enabled: true },
  { id: "preenchimento", label: "Preenchimento inteligente", description: "Sugere campos a partir dos dados já identificados.", enabled: false },
  { id: "duplicidade", label: "Tratamento de duplicidades", description: "Identifica documentos processados mais de uma vez.", enabled: true },
  { id: "validacoes", label: "Validações automáticas", description: "Valida dados essenciais antes da conclusão.", enabled: true },
  { id: "filtros", label: "Preferências de filtros", description: "Preserva preferências de uso dos filtros.", enabled: false },
];
