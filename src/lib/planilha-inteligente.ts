import type { Pagamento } from "@/lib/pagamentos-constants";
import type { PagamentoInput } from "@/lib/pagamentos";

/**
 * Planilha Inteligente — Pagamentos Diversos > Lançamentos
 *
 * Motor 100% local (nenhum dado sai do navegador) que aprende com o histórico
 * de lançamentos da própria base para:
 *  - identificar padrões recorrentes;
 *  - sugerir preenchimentos automáticos;
 *  - sugerir informações frequentemente utilizadas;
 *  - auxiliar na validação e apontar inconsistências;
 *  - alertar sobre campos incompletos.
 *
 * REGRA: a inteligência é APENAS assistência. Nada é gravado sem ação do
 * usuário, que pode alterar, corrigir ou ignorar qualquer sugestão.
 */

export const APRENDIZADO_KEY = "portal_smart_learning";

export function aprendizadoAtivo(): boolean {
  if (typeof window === "undefined") return false;
  // Ativado por padrão; desligado apenas se o usuário optar em Configurações.
  return localStorage.getItem(APRENDIZADO_KEY) !== "false";
}

/** Campos textuais aprendidos e sugeridos. */
export const CAMPOS_APRENDIDOS = [
  "celula",
  "arquivo_remessa",
  "tipo_arquivo",
  "banco",
  "empresa",
  "descricao_pagamento",
  "competencia",
  "folha",
  "natureza_pagamento",
  "observacao",
] as const;

export type CampoAprendido = (typeof CAMPOS_APRENDIDOS)[number];

/** Campos considerados essenciais para um lançamento completo. */
export const CAMPOS_OBRIGATORIOS: { key: keyof Pagamento; label: string }[] = [
  { key: "celula", label: "Célula" },
  { key: "empresa", label: "Empresa" },
  { key: "banco", label: "Banco" },
  { key: "data_credito", label: "Data de crédito" },
  { key: "valor_lg", label: "Valor LG" },
  { key: "descricao_pagamento", label: "Descrição do pagamento" },
  { key: "competencia", label: "Competência" },
];

type Contagem = Map<string, number>;

export interface ModeloInteligente {
  /** Total de lançamentos considerados no aprendizado. */
  amostra: number;
  /** Frequência global por campo. */
  frequencias: Record<string, Contagem>;
  /** Frequência condicionada: `${campoBase}=${valor}` → campo → contagem. */
  condicionais: Map<string, Record<string, Contagem>>;
  /** Estatística de valor (valor_lg) por empresa, para detectar outliers. */
  valorPorEmpresa: Map<string, { soma: number; n: number; max: number }>;
}

/** Campos usados como "âncora" para aprender associações recorrentes. */
const ANCORAS: CampoAprendido[] = ["celula", "empresa", "descricao_pagamento", "banco"];

const txt = (v: unknown): string | null => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

function bump(map: Contagem, valor: string) {
  map.set(valor, (map.get(valor) ?? 0) + 1);
}

/** Constrói o modelo de padrões a partir do histórico da base. */
export function construirModelo(rows: Pagamento[]): ModeloInteligente {
  const frequencias: Record<string, Contagem> = {};
  const condicionais = new Map<string, Record<string, Contagem>>();
  const valorPorEmpresa = new Map<string, { soma: number; n: number; max: number }>();

  for (const campo of CAMPOS_APRENDIDOS) frequencias[campo] = new Map();

  for (const r of rows) {
    for (const campo of CAMPOS_APRENDIDOS) {
      const v = txt(r[campo as keyof Pagamento]);
      if (v) bump(frequencias[campo], v);
    }

    for (const ancora of ANCORAS) {
      const base = txt(r[ancora as keyof Pagamento]);
      if (!base) continue;
      const chave = `${ancora}=${base}`;
      let bucket = condicionais.get(chave);
      if (!bucket) {
        bucket = {};
        condicionais.set(chave, bucket);
      }
      for (const campo of CAMPOS_APRENDIDOS) {
        if (campo === ancora) continue;
        const v = txt(r[campo as keyof Pagamento]);
        if (!v) continue;
        if (!bucket[campo]) bucket[campo] = new Map();
        bump(bucket[campo], v);
      }
    }

    const emp = txt(r.empresa);
    const valor = typeof r.valor_lg === "number" ? r.valor_lg : null;
    if (emp && valor != null && valor > 0) {
      const cur = valorPorEmpresa.get(emp) ?? { soma: 0, n: 0, max: 0 };
      cur.soma += valor;
      cur.n += 1;
      cur.max = Math.max(cur.max, valor);
      valorPorEmpresa.set(emp, cur);
    }
  }

  return { amostra: rows.length, frequencias, condicionais, valorPorEmpresa };
}

const ordenar = (m: Contagem | undefined, limite: number) =>
  m
    ? [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limite).map(([v]) => v)
    : [];

/**
 * Sugere valores para um campo, priorizando o que é recorrente no contexto da
 * própria linha (ex.: banco mais usado para aquela empresa).
 */
export function sugerirValores(
  modelo: ModeloInteligente,
  campo: string,
  linha?: Partial<Pagamento>,
  limite = 8,
): string[] {
  const out: string[] = [];
  const push = (vals: string[]) => {
    for (const v of vals) if (!out.includes(v)) out.push(v);
  };

  if (linha) {
    for (const ancora of ANCORAS) {
      if (ancora === campo) continue;
      const base = txt(linha[ancora as keyof Pagamento]);
      if (!base) continue;
      push(ordenar(modelo.condicionais.get(`${ancora}=${base}`)?.[campo], limite));
    }
  }
  push(ordenar(modelo.frequencias[campo], limite));
  return out.slice(0, limite);
}

export interface SugestaoCampo {
  campo: keyof Pagamento;
  label: string;
  valor: string;
  /** 0–100 — quão recorrente é o padrão identificado. */
  confianca: number;
  origem: string;
}

/**
 * Sugere o preenchimento dos campos vazios de uma linha com base nos padrões
 * recorrentes. Retorna somente sugestões com confiança relevante.
 */
export function sugerirPreenchimento(
  modelo: ModeloInteligente,
  linha: Pagamento,
  rotulos: Record<string, string>,
  minConfianca = 60,
): SugestaoCampo[] {
  const sugestoes: SugestaoCampo[] = [];

  for (const campo of CAMPOS_APRENDIDOS) {
    if (campo === "observacao") continue; // texto livre: não sugerimos automaticamente
    if (txt(linha[campo as keyof Pagamento])) continue;

    let melhor: { valor: string; confianca: number; origem: string } | null = null;

    for (const ancora of ANCORAS) {
      if (ancora === campo) continue;
      const base = txt(linha[ancora as keyof Pagamento]);
      if (!base) continue;
      const cont = modelo.condicionais.get(`${ancora}=${base}`)?.[campo];
      if (!cont || cont.size === 0) continue;
      const total = [...cont.values()].reduce((a, b) => a + b, 0);
      const [valor, n] = [...cont.entries()].sort((a, b) => b[1] - a[1])[0];
      const confianca = Math.round((n / total) * 100);
      if (!melhor || confianca > melhor.confianca) {
        melhor = { valor, confianca, origem: `${rotulos[ancora] ?? ancora} = ${base}` };
      }
    }

    // Sem âncora: usa o padrão global dominante da base.
    if (!melhor) {
      const cont = modelo.frequencias[campo];
      if (cont && cont.size > 0) {
        const total = [...cont.values()].reduce((a, b) => a + b, 0);
        const [valor, n] = [...cont.entries()].sort((a, b) => b[1] - a[1])[0];
        const confianca = Math.round((n / total) * 100);
        melhor = { valor, confianca, origem: "padrão mais frequente da base" };
      }
    }

    if (melhor && melhor.confianca >= minConfianca) {
      sugestoes.push({
        campo: campo as keyof Pagamento,
        label: rotulos[campo] ?? campo,
        valor: melhor.valor,
        confianca: melhor.confianca,
        origem: melhor.origem,
      });
    }
  }

  return sugestoes.sort((a, b) => b.confianca - a.confianca);
}

export function sugestoesParaPatch(sugestoes: SugestaoCampo[]): PagamentoInput {
  const patch: Record<string, unknown> = {};
  for (const s of sugestoes) patch[s.campo as string] = s.valor;
  return patch as PagamentoInput;
}

export type TipoAlerta = "incompleto" | "inconsistencia";

export interface AlertaLinha {
  tipo: TipoAlerta;
  campo?: keyof Pagamento;
  mensagem: string;
}

/** Valida uma linha: campos incompletos e possíveis inconsistências. */
export function validarLinha(modelo: ModeloInteligente, linha: Pagamento): AlertaLinha[] {
  const alertas: AlertaLinha[] = [];

  for (const c of CAMPOS_OBRIGATORIOS) {
    const v = linha[c.key];
    if (v == null || String(v).trim() === "") {
      alertas.push({ tipo: "incompleto", campo: c.key, mensagem: `${c.label} não preenchido` });
    }
  }

  const valor = typeof linha.valor_lg === "number" ? linha.valor_lg : null;
  if (valor != null && valor <= 0) {
    alertas.push({ tipo: "inconsistencia", campo: "valor_lg", mensagem: "Valor LG deve ser maior que zero" });
  }

  const emp = txt(linha.empresa);
  if (emp && valor != null && valor > 0) {
    const stat = modelo.valorPorEmpresa.get(emp);
    if (stat && stat.n >= 5) {
      const media = stat.soma / stat.n;
      if (media > 0 && valor > media * 8) {
        alertas.push({
          tipo: "inconsistencia",
          campo: "valor_lg",
          mensagem: `Valor muito acima do padrão de ${emp} (média ${media.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})`,
        });
      }
    }
  }

  const qtde = typeof linha.qtde_colaboradores === "number" ? linha.qtde_colaboradores : null;
  if (qtde != null && qtde < 0) {
    alertas.push({ tipo: "inconsistencia", campo: "qtde_colaboradores", mensagem: "Quantidade de colaboradores negativa" });
  }

  // Coerência aprendida: valor que nunca aparece junto da âncora dominante.
  const celula = txt(linha.celula);
  const desc = txt(linha.descricao_pagamento);
  if (celula && desc) {
    const cont = modelo.condicionais.get(`celula=${celula}`)?.["descricao_pagamento"];
    if (cont && cont.size >= 3 && !cont.has(desc)) {
      alertas.push({
        tipo: "inconsistencia",
        campo: "descricao_pagamento",
        mensagem: `Descrição incomum para a célula ${celula} — confira se está correta`,
      });
    }
  }

  if (linha.data_credito) {
    const d = new Date(String(linha.data_credito) + "T00:00:00");
    if (!isNaN(d.getTime())) {
      const diasFuturo = (d.getTime() - Date.now()) / 86_400_000;
      if (diasFuturo > 180) {
        alertas.push({ tipo: "inconsistencia", campo: "data_credito", mensagem: "Data de crédito muito distante no futuro" });
      }
    }
  }

  return alertas;
}

export interface DiagnosticoBase {
  totalLinhas: number;
  linhasComAlerta: number;
  incompletos: number;
  inconsistencias: number;
  porLinha: Map<string, AlertaLinha[]>;
}

export function diagnosticarBase(modelo: ModeloInteligente, rows: Pagamento[]): DiagnosticoBase {
  const porLinha = new Map<string, AlertaLinha[]>();
  let incompletos = 0;
  let inconsistencias = 0;

  for (const r of rows) {
    const alertas = validarLinha(modelo, r);
    if (alertas.length) {
      porLinha.set(r.id, alertas);
      incompletos += alertas.filter((a) => a.tipo === "incompleto").length;
      inconsistencias += alertas.filter((a) => a.tipo === "inconsistencia").length;
    }
  }

  return {
    totalLinhas: rows.length,
    linhasComAlerta: porLinha.size,
    incompletos,
    inconsistencias,
    porLinha,
  };
}
