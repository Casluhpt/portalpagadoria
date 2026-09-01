import * as XLSX from "xlsx";

export type ImportRow = Record<string, unknown>;

export type ImportField = {
  key: string;
  required?: boolean;
  aliases: string[];
};

export type ImportMapping = {
  sourceHeader: string;
  targetField: string;
  confidence: number;
};

export type ImportPreview = {
  headers: string[];
  mappings: ImportMapping[];
  missingRequired: string[];
  rows: ImportRow[];
  totalRows: number;
  ignoredHeaders: string[];
};

const normalizeHeader = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();

const similarity = (a: string, b: string) => {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;
  const grams = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) grams.add(a.slice(i, i + 2));
  let hits = 0;
  for (let i = 0; i < b.length - 1; i++) if (grams.has(b.slice(i, i + 2))) hits++;
  return hits / Math.max(1, Math.max(a.length, b.length) - 1);
};

function parseNumber(value: unknown): number | unknown {
  if (typeof value === "number") return value;
  if (value == null || value === "") return value;
  const text = String(value).trim().replace(/R\$|BRL/gi, "").replace(/\s/g, "");
  if (!text) return value;
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text.replace(/,/g, "");
  const parsed = Number(normalized.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : value;
}

function parseDate(value: unknown): string | unknown {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  const text = String(value ?? "").trim();
  const br = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (br) {
    const year = br[3].length === 2 ? `20${br[3]}` : br[3];
    return `${year}-${String(br[2]).padStart(2, "0")}-${String(br[1]).padStart(2, "0")}`;
  }
  const parsed = new Date(text);
  return !Number.isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : value;
}

export async function readSpreadsheet(file: File): Promise<ImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: "", raw: true });
}

export function mapImportRows(
  rows: ImportRow[],
  fields: ImportField[],
  options?: { numericFields?: string[]; dateFields?: string[] },
): ImportPreview {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const mappings: ImportMapping[] = [];
  const used = new Set<string>();

  for (const field of fields) {
    let best: ImportMapping | undefined;
    for (const header of headers) {
      if (used.has(header)) continue;
      const candidates = [field.key, ...field.aliases].map(normalizeHeader);
      const score = Math.max(...candidates.map((candidate) => similarity(normalizeHeader(header), candidate)));
      if (!best || score > best.confidence) {
        best = { sourceHeader: header, targetField: field.key, confidence: score };
      }
    }
    if (best && best.confidence >= 0.55) {
      mappings.push(best);
      used.add(best.sourceHeader);
    }
  }

  const mappedTargets = new Set(mappings.map((m) => m.targetField));
  const missingRequired = fields.filter((f) => f.required && !mappedTargets.has(f.key)).map((f) => f.key);
  const numeric = new Set(options?.numericFields ?? []);
  const dates = new Set(options?.dateFields ?? []);

  const normalizedRows = rows.map((row) => {
    const result: ImportRow = {};
    for (const mapping of mappings) {
      const value = row[mapping.sourceHeader];
      result[mapping.targetField] = numeric.has(mapping.targetField)
        ? parseNumber(value)
        : dates.has(mapping.targetField)
          ? parseDate(value)
          : value;
    }
    return result;
  });

  return {
    headers,
    mappings,
    missingRequired,
    rows: normalizedRows,
    totalRows: normalizedRows.length,
    ignoredHeaders: headers.filter((header) => !used.has(header)),
  };
}

export function importFieldsForPagamentos() {
  return [
    { key: "data", required: true, aliases: ["data", "data pagamento", "data credito", "dt pagamento"] },
    { key: "empresa", required: true, aliases: ["empresa", "companhia", "empresa pagadora"] },
    { key: "banco", required: true, aliases: ["banco", "instituicao", "instituição financeira"] },
    { key: "valor", required: true, aliases: ["valor", "valor total", "valor pagamento", "valor lg"] },
    { key: "documento", aliases: ["documento", "doc", "numero documento", "n documento"] },
    { key: "favorecido", aliases: ["favorecido", "beneficiario", "beneficiário", "fornecedor"] },
  ] satisfies ImportField[];
}

export function importFieldsForConciliacao() {
  return [
    { key: "data", required: true, aliases: ["data", "data credito", "data pagamento", "data movimento"] },
    { key: "empresa", aliases: ["empresa", "companhia"] },
    { key: "valor", required: true, aliases: ["valor", "valor total", "valor lancamento", "valor pagamento"] },
    { key: "banco", aliases: ["banco", "instituicao", "instituição"] },
    { key: "conta", aliases: ["conta", "conta bancaria", "conta bancária"] },
    { key: "agencia", aliases: ["agencia", "agência"] },
    { key: "documento", aliases: ["documento", "doc", "id transacao", "id transação"] },
    { key: "status", aliases: ["status", "situacao", "situação", "resultado"] },
  ] satisfies ImportField[];
}
