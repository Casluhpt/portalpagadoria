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

export function executarConciliacao(importados: ConciliacaoItem[], base: ConciliacaoItem[]) {
  const resultados = importados.map(imp => {
    // Nível 1: Correspondência exata (Empresa, Data, Valor)
    const exactMatch = base.find(b => 
      b.empresa === imp.empresa && 
      b.data === imp.data && 
      Math.abs(b.valor - imp.valor) < 0.01
    );

    if (exactMatch) {
      return { ...imp, matchId: "ok", nivel: 1, diferenca: 0 };
    }

    // Nível 2: Soma de valores para a mesma empresa e data próxima (± 3 dias)
    const dataImp = new Date(imp.data);
    const candidatos = base.filter(b => {
      if (b.empresa !== imp.empresa) return false;
      const dataB = new Date(b.data);
      const diffDays = Math.abs(dataB.getTime() - dataImp.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 3;
    });

    // Tenta encontrar uma combinação de candidatos que resulte no valor
    const sugestao = buscarCombinacao(candidatos, imp.valor);
    if (sugestao.length > 0) {
      const soma = sugestao.reduce((s, c) => s + c.valor, 0);
      return { 
        ...imp, 
        matchId: "sugestao", 
        nivel: 2, 
        sugestao, 
        diferenca: imp.valor - soma 
      };
    }

    return { ...imp, matchId: "divergente", nivel: 5, diferenca: imp.valor };
  });

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
