import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { format } from "date-fns";

export type ConciliacaoItem = {
  empresa: string;
  data: string;
  valor: number;
  tipo: "Varejo" | "Distribuição";
  origem: "importado" | "base";
  id?: string;
  matchId?: string;
  nivel?: number;
  diferenca?: number;
  sugestao?: ConciliacaoItem[];
};

export async function fetchCompetenciasDisponiveis() {
  // Busca competências da base ativa
  const { data: ativas, error: err1 } = await supabase
    .from("pagamentos_diversos")
    .select("competencia")
    .not("competencia", "is", null);
  
  if (err1) throw err1;

  // Busca competências fechadas
  const { data: fechadas, error: err2 } = await supabase
    .from("fechamento_pagamentos")
    .select("mes");
    
  if (err2) throw err2;

  const todas = new Set<string>();
  ativas?.forEach(r => {
    if (r.competencia) todas.add(r.competencia);
  });
  fechadas?.forEach(r => {
    if (r.mes) todas.add(r.mes);
  });

  return Array.from(todas).sort().reverse();
}

export async function fetchPagamentosParaConciliacao(competencias: string[]) {
  // 1. Busca na base ativa
  const { data: ativas, error: err1 } = await supabase
    .from("pagamentos_diversos")
    .select("empresa, data_credito, valor_lg, competencia")
    .in("competencia", competencias);
  
  if (err1) throw err1;

  // Em uma implementação real completa, buscaríamos também no histórico de itens arquivados
  
  return (ativas || []).map(r => ({
    empresa: r.empresa || "N/A",
    data: r.data_credito || "",
    valor: Number(r.valor_lg) || 0,
    origem: "base" as const,
    tipo: "Varejo" as any // Será definido na UI
  }));
}

export async function executarConciliacao(
  tipo: "Varejo" | "Distribuição", 
  importados: any[], 
  userId: string
) {
  // 1. Buscar a base de referência (Pagamentos Diversos ativos + Competências recentes)
  const { data: baseRows, error } = await supabase
    .from("pagamentos_diversos")
    .select("empresa, data_credito, valor_lg, celula, id")
    .limit(10000); // Em prod, ideal filtrar por competências próximas

  if (error) throw error;

  const base: ConciliacaoItem[] = (baseRows || []).map(r => ({
    empresa: r.empresa || "",
    data: r.data_credito || "",
    valor: Number(r.valor_lg) || 0,
    origem: "base",
    tipo,
    id: r.id
  }));

  const normalizados = importados.map(imp => {
    // Normalização básica de campos comuns em arquivos de retorno
    return {
      empresa: imp.Empresa || imp.empresa || imp.EMPRESA || "",
      data: imp.Data || imp.data || imp.DATA || imp["Data Crédito"] || "",
      valor: Number(String(imp.Valor || imp.valor || imp.VALOR || imp["Valor Total"] || 0).replace(/[^\d.,]/g, "").replace(",", ".")),
      origem: "importado" as const,
      tipo,
      original: imp
    };
  });

  const resultados = normalizados.map(imp => {
    // Nível 1: Correspondência exata (Empresa, Data, Valor)
    const exactMatch = base.find(b => 
      b.empresa === imp.empresa && 
      b.data === imp.data && 
      Math.abs(b.valor - imp.valor) < 0.01
    );

    if (exactMatch) {
      return { ...imp, matchId: "ok", nivel: 1, diferenca: 0 };
    }

    // Nível 2: Data próxima (± 2 dias)
    const dataImp = new Date(imp.data);
    const dataProxima = base.find(b => {
      if (b.empresa !== imp.empresa || Math.abs(b.valor - imp.valor) > 0.01) return false;
      const dataB = new Date(b.data);
      const diffDays = Math.abs(dataB.getTime() - dataImp.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 2;
    });

    if (dataProxima) {
      return { ...imp, matchId: "ok-data", nivel: 2, diferenca: 0 };
    }

    // Nível 3: Soma de valores (SubSet Sum simplificado)
    const candidatos = base.filter(b => {
      if (b.empresa !== imp.empresa) return false;
      const dataB = new Date(b.data);
      const diffDays = Math.abs(dataB.getTime() - dataImp.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 3;
    });

    const sugestao = buscarCombinacao(candidatos, imp.valor);
    if (sugestao.length > 1) { // 1 item seria Nível 1/2
      const soma = sugestao.reduce((s, c) => s + c.valor, 0);
      return { 
        ...imp, 
        matchId: "soma", 
        nivel: 3, 
        sugestao, 
        diferenca: imp.valor - soma 
      };
    }

    return { ...imp, matchId: "divergente", nivel: 5, diferenca: imp.valor };
  });

  // 2. Gerar Excel com os resultados em 2 sheets
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Todos os registros importados com seu status
  const ws1Data = resultados.map(r => ({
    "Empresa": r.empresa,
    "Data": r.data,
    "Valor Original": r.valor,
    "Nível Conciliação": r.nivel,
    "Status": r.nivel === 5 ? "Divergente" : "Conciliado",
    "Diferença": r.diferenca
  }));
  const ws1 = XLSX.utils.json_to_sheet(ws1Data);
  XLSX.utils.book_append_sheet(wb, ws1, tipo);

  // Sheet 2: Somente Divergências (Nível 5) ou Diferenças
  const ws2Data = resultados.filter(r => r.nivel >= 3).map(r => ({
    "Empresa": r.empresa,
    "Data": r.data,
    "Valor": r.valor,
    "Nível": r.nivel,
    "Diferença": r.diferenca,
    "Sugestão": r.sugestao?.map(s => `ID:${s.id} (R$ ${s.valor})`).join(", ") || "Nenhuma"
  }));
  const ws2 = XLSX.utils.json_to_sheet(ws2Data);
  XLSX.utils.book_append_sheet(wb, ws2, "Divergências e Sugestões");

  const fileName = `conciliacao-${tipo.toLowerCase()}-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`;
  XLSX.writeFile(wb, fileName);

  // 3. Notificar e registrar
  const { notificarArquivoPronto } = await import("./notificacoes-arquivos");
  await notificarArquivoPronto(
    `Conciliação ${tipo} Concluída`,
    `O processamento de ${resultados.length} registros foi finalizado. O arquivo detalhado está disponível.`,
    userId
  );

  return resultados;
}


export async function exportarConciliacaoSemanal(
  dataIni: string,
  dataFim: string,
  userId: string
) {
  // 1. Busca dados filtrados por data
  const { data, error } = await supabase
    .from("pagamentos_diversos")
    .select("*")
    .gte("data_credito", dataIni)
    .lte("data_credito", dataFim);

  if (error) throw error;

  // 2. Gera Excel com títulos da base
  const ws = XLSX.utils.json_to_sheet(data || []);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pagamentos Filtrados");
  
  const fileName = `conciliacao-semanal-${dataIni}-a-${dataFim}.xlsx`;
  XLSX.writeFile(wb, fileName);

  // 3. Notificação e Anexo (Simulado - em prod enviaria para Storage)
  const { notificarArquivoPronto } = await import("./notificacoes-arquivos");
  await notificarArquivoPronto(
    "Relatório de Conciliação Pronto",
    `O arquivo filtrado de ${dataIni} a ${dataFim} foi gerado. Disponível em Base de Anexos > Conciliação Bancária.`,
    userId
  );
  
  return data;
}

function buscarCombinacao(arr: ConciliacaoItem[], target: number): ConciliacaoItem[] {
  const result: ConciliacaoItem[] = [];
  let currentSum = 0;
  const sorted = [...arr].sort((a, b) => b.valor - a.valor);
  
  for (const item of sorted) {
    if (currentSum + item.valor <= target + 0.01) {
      currentSum += item.valor;
      result.push(item);
    }
    if (Math.abs(currentSum - target) < 0.01) return result;
  }
  
  return [];
}
