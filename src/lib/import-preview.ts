/**
 * Camada única e obrigatória de pré-validação de importações do Portal.
 *
 * Nenhuma importação grava direto: todo arquivo passa por
 * detecção de estrutura → mapeamento de colunas → validação linha a linha →
 * prévia conferida pelo usuário → gravação.
 */
import * as XLSX from "xlsx";
import { inspectMoney, parseMoney, formatBRL, type MoneyParse } from "@/lib/money";

export type CampoTipo = "texto" | "data" | "valor" | "numero";

export type CampoSpec = {
  key: string;
  label: string;
  tipo: CampoTipo;
  obrigatorio?: boolean;
  /** Variações aceitas de cabeçalho (comparação sem acento/caixa). */
  aliases: string[];
};

export type LinhaPrevia = {
  /** Linha real na planilha (1-based, conforme o arquivo). */
  linhaArquivo: number;
  valores: Record<string, unknown>;
  monetarios: Record<string, MoneyParse>;
  erros: string[];
  advertencias: string[];
  valida: boolean;
};

export type PreviaImportacao = {
  arquivo: string;
  formato: "xlsx" | "xls" | "csv" | "txt";
  abas: string[];
  abaSelecionada: string;
  /** Índice (0-based) da linha de cabeçalho detectada. */
  linhaCabecalho: number;
  cabecalhos: string[];
  mapeamento: Record<string, string | null>;
  camposFaltando: string[];
  linhas: LinhaPrevia[];
  totalLinhas: number;
  linhasValidas: number;
  linhasRejeitadas: number;
  valorTotal: number;
  valorTotalFormatado: string;
  competencias: string[];
  empresas: string[];
  erros: string[];
  advertencias: string[];
  /** false quando faltam colunas obrigatórias ou não há nenhuma linha válida. */
  podeImportar: boolean;
};

const EXT_ACEITAS = ["xlsx", "xls", "csv", "txt"] as const;

const semAcento = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export function extensaoDe(nome: string): string {
  return nome.split(".").pop()?.toLowerCase() ?? "";
}

export function formatoAceito(nome: string): boolean {
  return (EXT_ACEITAS as readonly string[]).includes(extensaoDe(nome));
}

/** Detecta a linha de cabeçalho: a primeira com maior quantidade de textos preenchidos. */
function detectarCabecalho(matriz: unknown[][]): number {
  let melhor = 0;
  let melhorScore = -1;
  const limite = Math.min(matriz.length, 25);
  for (let i = 0; i < limite; i++) {
    const linha = matriz[i] ?? [];
    const preenchidas = linha.filter((c) => c != null && String(c).trim() !== "").length;
    const textuais = linha.filter(
      (c) => typeof c === "string" && String(c).trim() !== "" && !/^-?[\d.,\s]+$/.test(String(c)),
    ).length;
    const score = textuais * 2 + preenchidas;
    if (preenchidas >= 2 && score > melhorScore) {
      melhorScore = score;
      melhor = i;
    }
  }
  return melhor;
}

function mapearColunas(cabecalhos: string[], campos: CampoSpec[]) {
  const mapeamento: Record<string, string | null> = {};
  const usados = new Set<string>();
  for (const campo of campos) {
    const alvos = [campo.label, ...campo.aliases].map(semAcento);
    // 1) igualdade exata
    let achado = cabecalhos.find((h) => !usados.has(h) && alvos.includes(semAcento(h)));
    // 2) contém
    if (!achado)
      achado = cabecalhos.find(
        (h) => !usados.has(h) && alvos.some((a) => semAcento(h).includes(a)),
      );
    if (achado) usados.add(achado);
    mapeamento[campo.key] = achado ?? null;
  }
  return mapeamento;
}

export function parseDataBR(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    const ms = Math.round((v - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    const y = m[3].length === 2 ? "20" + m[3] : m[3];
    return `${y}-${mo}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export type OpcoesPrevia = {
  campos: CampoSpec[];
  /** Nome da aba escolhida manualmente pelo usuário. */
  aba?: string;
  /** Sobrescreve o mapeamento automático (campo → cabeçalho). */
  mapeamentoManual?: Record<string, string | null>;
  /** Máximo de exemplos guardados na prévia. */
  maxExemplos?: number;
};

/** Analisa o arquivo e devolve a prévia obrigatória, sem gravar nada. */
export async function analisarArquivo(file: File, opts: OpcoesPrevia): Promise<PreviaImportacao> {
  const ext = extensaoDe(file.name);
  if (!formatoAceito(file.name)) {
    throw new Error(
      "Formato não suportado para importação estruturada. Utilize Excel (.xlsx/.xls), CSV ou TXT estruturado. PDF, DOC e DOCX podem ser anexados, mas não alimentam a base automaticamente.",
    );
  }

  const buf = await file.arrayBuffer();
  let wb: XLSX.WorkBook;
  try {
    if (ext === "csv" || ext === "txt") {
      const texto = new TextDecoder("utf-8").decode(buf);
      wb = XLSX.read(texto, { type: "string", raw: false, cellDates: false });
    } else {
      wb = XLSX.read(buf, { cellDates: false });
    }
  } catch {
    throw new Error(
      "Não foi possível importar o arquivo. Verifique se o documento está protegido, corrompido ou fora do padrão aceito.",
    );
  }

  const abas = wb.SheetNames;
  if (abas.length === 0) throw new Error("O arquivo não possui abas legíveis.");

  const erros: string[] = [];
  const advertencias: string[] = [];

  // Primeira aba válida (com pelo menos 2 linhas) ou a escolhida pelo usuário.
  const abaSelecionada =
    opts.aba && abas.includes(opts.aba)
      ? opts.aba
      : abas.find((nome) => {
          const m = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[nome], { header: 1, defval: null });
          return m.filter((l) => (l ?? []).some((c) => c != null && String(c).trim() !== "")).length >= 2;
        }) ?? abas[0];

  const matrizBruta = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[abaSelecionada], {
    header: 1,
    defval: null,
  });
  const matriz = matrizBruta.map((l) => l ?? []);

  const linhaCabecalho = detectarCabecalho(matriz);
  const cabecalhos = (matriz[linhaCabecalho] ?? []).map((c, i) =>
    c == null || String(c).trim() === "" ? `Coluna ${i + 1}` : String(c).trim(),
  );

  const mapeamento = {
    ...mapearColunas(cabecalhos, opts.campos),
    ...(opts.mapeamentoManual ?? {}),
  };

  const camposFaltando = opts.campos
    .filter((c) => c.obrigatorio !== false && !mapeamento[c.key])
    .map((c) => c.label);
  if (camposFaltando.length > 0) {
    erros.push(
      `Colunas obrigatórias não identificadas: ${camposFaltando.join(", ")}. Relacione as colunas manualmente antes de continuar.`,
    );
  }

  const idxDe = (campoKey: string) => {
    const header = mapeamento[campoKey];
    return header ? cabecalhos.indexOf(header) : -1;
  };

  const linhas: LinhaPrevia[] = [];
  let valorTotal = 0;
  let linhasValidas = 0;
  let linhasRejeitadas = 0;
  const competencias = new Set<string>();
  const empresas = new Set<string>();
  const maxExemplos = opts.maxExemplos ?? 200;

  for (let i = linhaCabecalho + 1; i < matriz.length; i++) {
    const bruta = matriz[i];
    const vazia = !bruta.some((c) => c != null && String(c).trim() !== "");
    if (vazia) continue; // ignora linhas totalmente vazias

    const valores: Record<string, unknown> = {};
    const monetarios: Record<string, MoneyParse> = {};
    const errosLinha: string[] = [];
    const advLinha: string[] = [];

    for (const campo of opts.campos) {
      const idx = idxDe(campo.key);
      const bruto = idx >= 0 ? bruta[idx] : null;

      if (campo.tipo === "valor") {
        const insp = inspectMoney(bruto, { obrigatorio: campo.obrigatorio !== false });
        monetarios[campo.key] = insp;
        valores[campo.key] = insp.valor;
        if (!insp.ok) errosLinha.push(`${campo.label}: ${insp.motivo ?? "valor inválido"}`);
      } else if (campo.tipo === "data") {
        const iso = parseDataBR(bruto);
        valores[campo.key] = iso;
        if (!iso && campo.obrigatorio !== false) errosLinha.push(`${campo.label}: data inválida ou ausente.`);
        if (iso) competencias.add(iso.slice(0, 7));
      } else if (campo.tipo === "numero") {
        const n = parseMoney(bruto);
        valores[campo.key] = n;
        if (n == null && campo.obrigatorio !== false) errosLinha.push(`${campo.label}: número inválido.`);
      } else {
        const txt = bruto == null ? null : String(bruto).trim() || null;
        valores[campo.key] = txt;
        if (!txt && campo.obrigatorio !== false) errosLinha.push(`${campo.label}: campo obrigatório vazio.`);
        if (txt && /empresa|coligada/i.test(campo.label)) empresas.add(txt);
      }
    }

    const valida = errosLinha.length === 0 && camposFaltando.length === 0;
    if (valida) {
      linhasValidas++;
      for (const insp of Object.values(monetarios)) valorTotal += insp.valor ?? 0;
    } else {
      linhasRejeitadas++;
    }

    if (linhas.length < maxExemplos) {
      linhas.push({ linhaArquivo: i + 1, valores, monetarios, erros: errosLinha, advertencias: advLinha, valida });
    }
  }

  const totalLinhas = linhasValidas + linhasRejeitadas;
  if (totalLinhas === 0) erros.push("O arquivo não possui registros aproveitáveis.");
  if (linhasRejeitadas > 0)
    advertencias.push(`${linhasRejeitadas} linha(s) serão ignoradas por inconsistência.`);

  const divergenciaMonetaria = linhas.some((l) =>
    Object.values(l.monetarios).some((m) => !m.ok && m.original.trim() !== ""),
  );
  if (divergenciaMonetaria)
    advertencias.push(
      "Foi identificada divergência na leitura dos valores monetários. Revise o arquivo antes de continuar.",
    );

  return {
    arquivo: file.name,
    formato: (ext as PreviaImportacao["formato"]) ?? "xlsx",
    abas,
    abaSelecionada,
    linhaCabecalho,
    cabecalhos,
    mapeamento,
    camposFaltando,
    linhas,
    totalLinhas,
    linhasValidas,
    linhasRejeitadas,
    valorTotal: Math.round((valorTotal + Number.EPSILON) * 100) / 100,
    valorTotalFormatado: formatBRL(valorTotal),
    competencias: [...competencias].sort(),
    empresas: [...empresas].sort((a, b) => a.localeCompare(b, "pt-BR")),
    erros,
    advertencias,
    podeImportar: camposFaltando.length === 0 && linhasValidas > 0,
  };
}

/** Reprocessa o arquivo inteiro (sem limite de exemplos) devolvendo só as linhas válidas. */
export async function extrairLinhasValidas(
  file: File,
  opts: OpcoesPrevia,
): Promise<Record<string, unknown>[]> {
  const previa = await analisarArquivo(file, { ...opts, maxExemplos: Number.MAX_SAFE_INTEGER });
  if (!previa.podeImportar) {
    throw new Error(previa.erros[0] ?? "Arquivo inválido para importação.");
  }
  return previa.linhas.filter((l) => l.valida).map((l) => l.valores);
}
