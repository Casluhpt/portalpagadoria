export const BANCOS = ["ITAU", "BB"] as const;

export const EMPRESAS = [
  "PROFARMA","DROGASMIL","COF","D1000","INSTITUTO","LOCAFARMA","PROFARMA HB","PROMOVENDAS","ROSARIO","SPECIALTY",
  "TAMOIO EMPRESA 16","TAMOIO EMPRESA 17","TAMOIO EMPRESA 18","TAMOIO EMPRESA 19","TAMOIO EMPRESA 20",
  "TAMOIO EMPRESA 21","TAMOIO EMPRESA 22","TAMOIO EMPRESA 23","TAMOIO EMPRESA 24","TAMOIO EMPRESA 25",
  "TAMOIO EMPRESA 26","TAMOIO EMPRESA 27","TAMOIO EMPRESA 28","TAMOIO EMPRESA 31","TAMOIO EMPRESA 32",
  "TAMOIO EMPRESA 35","TAMOIO EMPRESA 36","TAMOIO EMPRESA 37","TAMOIO EMPRESA 38","TAMOIO EMPRESA 39",
  "TAMOIO EMPRESA 40","TAMOIO EMPRESA 41","TAMOIO EMPRESA 42","TAMOIO EMPRESA 43","TAMOIO EMPRESA 44",
] as const;

export const COMPETENCIAS = [
  "JANEIRO","FEVEREIRO","MARCO","ABRIL","MAIO","JUNHO",
  "JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO",
] as const;

export const FOLHAS = [
  "FOLHA 1","FOLHA 2","FOLHA 5","FOLHA 6","FOLHA 7","FOLHA 8","FOLHA 11","FOLHA 15","FOLHA 20",
  "FOLHA 31","FOLHA 34","FOLHA 35","FOLHA 60","FOLHA 61","FOLHA 64","FOLHA 65",
  "FOLHA 80","FOLHA 81","FOLHA 82","FOLHA 83","FOLHA 84","FOLHA 103","FOLHA 104",
] as const;

export const CELULAS = ["FOLHA","FÉRIAS","RESCISÃO","BENEFICIOS"] as const;

// Base Lista → Descrição do pagamento por Célula
export const DESCRICOES_POR_CELULA: Record<string, readonly string[]> = {
  FOLHA: [
    "PAGAMENTO RECESSO","PAGAMENTO DE FÉRIAS","ADIANTAMENTO SALARIAL","ADIANTAMENTO SALARIAL - PROLABORE",
    "PAGAMENTO DE ADIANTAMENTO DE 13º","PAGAMENTO DE RESCISÃO","PAGAMENTO DE RESCISÃO - COMPLEMENTAR",
    "PAGAMENTO FOLHA RETROATIVA","PAGAMENTO MENSAL","PAGAMENTO MENSAL - PROLABORE",
    "PENSÃO - FÉRIAS","PENSÃO MENSAL - FOLHA","REEMBOLSO DE PONTO","REEMBOLSO FOLHA","PAGAMENTO PPR",
  ],
  "FÉRIAS": [
    "PAGAMENTO RECESSO","PAGAMENTO DE FÉRIAS","ADIANTAMENTO SALARIAL","ADIANTAMENTO SALARIAL - PROLABORE",
    "PAGAMENTO DE ADIANTAMENTO DE 13º","PAGAMENTO DE RESCISÃO","PAGAMENTO DE RESCISÃO - COMPLEMENTAR",
    "PAGAMENTO FOLHA RETROATIVA","PAGAMENTO MENSAL","PAGAMENTO MENSAL - PROLABORE",
    "PENSÃO - FÉRIAS","PENSÃO MENSAL - FOLHA","REEMBOLSO DE PONTO","REEMBOLSO FOLHA","PAGAMENTO PPR",
  ],
  BENEFICIOS: [
    "REEMBOLSO - ALELO VA/VR","REEMBOLSO - VT","REEMBOLSO ADMISSÃO - ALELO VA/VR",
    "REEMBOLSO ADMISSÃO - VT","REEMBOLSO AM/AO","VA ESPECIE","VT ESPECIE",
  ],
  "RESCISÃO": [
    "PAGAMENTO DE PENSÃO - RESCISÃO","PAGAMENTO DE RESCISÃO","PAGAMENTO DE RESCISÃO - COMPLEMENTAR",
  ],
};

export const DESCRICOES_PAGAMENTO = Array.from(
  new Set(Object.values(DESCRICOES_POR_CELULA).flat()),
) as readonly string[];

export function getDescricoesByCelula(celula: string | null | undefined): readonly string[] {
  if (!celula) return DESCRICOES_PAGAMENTO;
  return DESCRICOES_POR_CELULA[celula] ?? DESCRICOES_PAGAMENTO;
}

export const STATUS_OPCOES = ["OK","PENDENTE","DIVERGENTE","CONCLUÍDO","EM ANÁLISE"] as const;

export const NATUREZAS = ["FOLHA","BENEFÍCIOS","RESCISÃO","FÉRIAS","PENSÃO","OUTROS"] as const;

export type Pagamento = {
  id: string;
  colaborador_nome: string;
  registrado_em: string;
  celula: string | null;
  arquivo_remessa: string | null;
  tipo_arquivo: string | null;
  ev_saida_folha_mensal: number | null;
  banco: string | null;
  empresa: string | null;
  data_credito: string | null;
  descricao_pagamento: string | null;
  valor_lg: number | null;
  competencia: string | null;
  competencia_ano: number | null;
  folha: string | null;
  qtde_colaboradores: number | null;
  observacao: string | null;
  valor_bankmanager: number | null;
  status_bankmanager: string | null;
  diferenca_lg_finnet: number | null;
  valor_itau: number | null;
  status_itau: string | null;
  diferenca_bank_itau: number | null;
  natureza_pagamento: string | null;
};

export const PAGAMENTO_CAMPOS: {
  key: keyof Pagamento;
  label: string;
  kind: "text" | "number" | "currency" | "date" | "select";
  options?: readonly string[];
  computed?: boolean;
  editable?: boolean;
}[] = [
  { key: "colaborador_nome", label: "Colaborador", kind: "text", editable: false },
  { key: "registrado_em", label: "Registrado em", kind: "text", editable: false },
  { key: "celula", label: "Célula", kind: "select", options: CELULAS },
  { key: "arquivo_remessa", label: "Arquivo Remessa", kind: "text" },
  { key: "tipo_arquivo", label: "Tipo de Arquivo", kind: "text" },
  { key: "ev_saida_folha_mensal", label: "Ev. Saída Folha", kind: "number" },
  { key: "banco", label: "Banco", kind: "select", options: BANCOS },
  { key: "empresa", label: "Empresa", kind: "select", options: EMPRESAS },
  { key: "data_credito", label: "Data de Crédito", kind: "date" },
  { key: "descricao_pagamento", label: "Descrição do Pagamento", kind: "select", options: DESCRICOES_PAGAMENTO },
  { key: "valor_lg", label: "Valor LG", kind: "currency" },
  { key: "competencia", label: "Competência", kind: "select", options: COMPETENCIAS },
  { key: "competencia_ano", label: "Ano", kind: "number" },
  { key: "folha", label: "Folha", kind: "select", options: FOLHAS },
  { key: "qtde_colaboradores", label: "Qtde Colab.", kind: "number" },
  { key: "observacao", label: "Observação", kind: "text" },
  { key: "valor_bankmanager", label: "Valor Bankmanager", kind: "currency" },
  { key: "status_bankmanager", label: "Status Bankmanager", kind: "select", options: STATUS_OPCOES },
  { key: "diferenca_lg_finnet", label: "Dif. LG × Finnet", kind: "currency", computed: true, editable: false },
  { key: "valor_itau", label: "Valor Itaú", kind: "currency" },
  { key: "status_itau", label: "Status Itaú", kind: "select", options: STATUS_OPCOES },
  { key: "diferenca_bank_itau", label: "Dif. Bank × Itaú", kind: "currency", computed: true, editable: false },
  { key: "natureza_pagamento", label: "Natureza", kind: "select", options: NATUREZAS },
];
