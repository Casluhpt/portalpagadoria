/**
 * Função financeira ÚNICA do Portal da Pagadoria.
 *
 * Toda leitura, importação, edição, cálculo, exibição e exportação de valores
 * monetários deve usar estas funções. Nenhum módulo pode fazer conversão própria
 * (ex.: remover pontos indiscriminadamente), pois isso multiplica o valor por 100
 * quando a planilha usa padrão internacional ("17475672.00").
 *
 * Regras:
 *  - célula numérica do Excel: usa o número real do parser, sem reprocessar;
 *  - texto pt-BR ("R$ 17.475.672,00"): ponto = milhar, vírgula = decimal;
 *  - texto internacional ("17475672.00"): ponto = decimal;
 *  - inteiro ("17475672"): valor inteiro em reais (nunca centavos);
 *  - nunca usa BigInt, nunca multiplica por 100, nunca trunca casas decimais.
 */

export type MoneyParse = {
  /** Conteúdo original da célula, como texto. */
  original: string;
  /** Valor numérico interpretado (reais, 2 casas), ou null se não interpretável. */
  valor: number | null;
  /** Valor formatado em pt-BR/BRL para exibição. */
  formatado: string;
  /** true quando o valor pôde ser interpretado com segurança. */
  ok: boolean;
  /** Motivo da rejeição/advertência, quando houver. */
  motivo?: string;
};

/** Arredondamento contábil para 2 casas, sem erro de ponto flutuante visível. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Formata para exibição/relatório. Nunca altera o valor armazenado. */
export function formatBRL(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Formata sem símbolo (para células editáveis). */
export function formatNumberBR(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const LIMITE_ABSOLUTO = 999_999_999_999.99;

/**
 * Interpreta qualquer valor monetário (célula Excel, texto ou número).
 * Retorna null quando o valor é vazio ou não interpretável.
 */
export function parseMoney(v: unknown): number | null {
  if (v == null) return null;

  // 1. Célula numérica: o parser já entregou o número real.
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return null;
    return round2(v);
  }

  if (typeof v === "boolean") return null;
  if (v instanceof Date) return null;

  let s = String(v).trim();
  if (s === "") return null;

  // Normaliza espaços (inclusive NBSP), moeda e sinais.
  s = s.replace(/\u00a0/g, " ").replace(/\s+/g, "");
  s = s.replace(/^R\$/i, "").replace(/^BRL/i, "");

  let negativo = false;
  // Padrão contábil "(1.234,56)" = negativo
  if (/^\(.*\)$/.test(s)) {
    negativo = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith("-")) {
    negativo = true;
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    s = s.slice(1);
  }

  if (!/^[\d.,]+$/.test(s)) return null;

  const temPonto = s.includes(".");
  const temVirgula = s.includes(",");
  let normalizado: string;

  if (temPonto && temVirgula) {
    // O separador que aparece por último é o decimal.
    const decimal = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
    const milhar = decimal === "," ? "." : ",";
    normalizado = s.split(milhar).join("").replace(decimal, ".");
  } else if (temVirgula) {
    const partes = s.split(",");
    if (partes.length > 2) {
      // 1,234,567 → vírgula como milhar (padrão internacional)
      normalizado = partes.join("");
    } else {
      // vírgula é decimal no padrão brasileiro
      normalizado = partes.join(".");
    }
  } else if (temPonto) {
    const partes = s.split(".");
    if (partes.length > 2) {
      // 17.475.672 → ponto como milhar
      normalizado = partes.join("");
    } else if (partes[1].length === 3 && partes[0].length <= 3 && partes[0] !== "0") {
      // Ambíguo ("1.000"): no padrão brasileiro é milhar.
      normalizado = partes.join("");
    } else {
      // 17475672.00 → ponto decimal (padrão internacional)
      normalizado = partes.join(".");
    }
  } else {
    // Inteiro puro: reais, nunca centavos.
    normalizado = s;
  }

  const n = Number(normalizado);
  if (!Number.isFinite(n)) return null;
  return round2(negativo ? -n : n);
}

/**
 * Interpreta e devolve a trilha completa (original → interpretado → formatado),
 * usada na prévia obrigatória de importação.
 */
export function inspectMoney(v: unknown, opts?: { obrigatorio?: boolean; limite?: number }): MoneyParse {
  const original =
    v == null ? "" : v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
  const valor = parseMoney(v);

  if (valor == null) {
    const vazio = original.trim() === "";
    return {
      original,
      valor: null,
      formatado: "",
      ok: vazio ? !opts?.obrigatorio : false,
      motivo: vazio
        ? opts?.obrigatorio
          ? "Valor obrigatório não informado."
          : undefined
        : "Não foi possível interpretar o valor monetário.",
    };
  }

  const limite = opts?.limite ?? LIMITE_ABSOLUTO;
  if (Math.abs(valor) > limite) {
    return {
      original,
      valor,
      formatado: formatBRL(valor),
      ok: false,
      motivo: "Valor acima do limite permitido para o portal.",
    };
  }

  return { original, valor, formatado: formatBRL(valor), ok: true };
}

/** Conjunto mínimo de valores validados pela especificação. */
export const CASOS_TESTE_MONETARIO: { entrada: unknown; esperado: number | null }[] = [
  { entrada: "R$ 0,00", esperado: 0 },
  { entrada: "R$ 0,01", esperado: 0.01 },
  { entrada: "R$ 1,00", esperado: 1 },
  { entrada: "R$ 10,00", esperado: 10 },
  { entrada: "R$ 100,00", esperado: 100 },
  { entrada: "R$ 1.000,00", esperado: 1000 },
  { entrada: "R$ 10.000,00", esperado: 10000 },
  { entrada: "R$ 100.000,00", esperado: 100000 },
  { entrada: "R$ 1.000.000,00", esperado: 1000000 },
  { entrada: "R$ 17.475.672,00", esperado: 17475672 },
  { entrada: "R$ 999.999.999,99", esperado: 999999999.99 },
  { entrada: "17475672.00", esperado: 17475672 },
  { entrada: "17475672", esperado: 17475672 },
  { entrada: 17475672, esperado: 17475672 },
  { entrada: "-1.234,56", esperado: -1234.56 },
  { entrada: "(1.234,56)", esperado: -1234.56 },
  { entrada: " 1 234,56 ", esperado: 1234.56 },
  { entrada: "", esperado: null },
  { entrada: null, esperado: null },
  { entrada: "abc", esperado: null },
];

/** Executa a bateria de testes monetários. Usada pelo Painel de Saúde. */
export function validarCadeiaMonetaria(): { total: number; falhas: { entrada: unknown; esperado: number | null; obtido: number | null }[] } {
  const falhas: { entrada: unknown; esperado: number | null; obtido: number | null }[] = [];
  for (const caso of CASOS_TESTE_MONETARIO) {
    const obtido = parseMoney(caso.entrada);
    if (obtido !== caso.esperado) falhas.push({ entrada: caso.entrada, esperado: caso.esperado, obtido });
  }
  return { total: CASOS_TESTE_MONETARIO.length, falhas };
}
