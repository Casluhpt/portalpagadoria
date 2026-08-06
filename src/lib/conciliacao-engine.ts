import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { format, differenceInDays } from "date-fns";

export type ConciliacaoItem = {
  empresa: string;
  data: string;
  valor: number;
  tipo: string;
  origem: "importado" | "base";
  id?: string;
  matchId?: string | null;
  nivel?: number;
  diferenca?: number;
  sugestao?: ConciliacaoItem[];
  banco?: string;
  descricao?: string;
  documento?: string;
  favorecido?: string;
  setor?: string;
  competencia?: string;
  motivoDivergencia?: string;
  status?: "Conciliado" | "Divergente" | "Recusado" | "Pendente";
  score?: number;
  valorPortal?: number;
};

export async function fetchCompetenciasDisponiveis() {
  const { data: ativas, error: err1 } = await supabase
    .from("pagamentos_diversos")
    .select("competencia")
    .not("competencia", "is", null);
  
  if (err1) throw err1;

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

export async function executarConciliacao(
  importados: any[], 
  basePortal: any[],
  userId: string
): Promise<ConciliacaoItem[]> {
  const normalizadosBanco = importados.map(imp => {
    const valor = Number(String(imp.Valor || imp.valor || imp.VALOR || imp["Valor Total"] || 0)
      .replace(/[^\d.,]/g, "").replace(",", "."));
    
    return {
      empresa: imp.Empresa || imp.empresa || imp.EMPRESA || "",
      data: imp.Data || imp.data || imp.DATA || imp["Data Crédito"] || "",
      valor,
      banco: imp.Banco || imp.banco || imp.BANCO || "",
      descricao: imp.Descricao || imp.descrição || imp.DESCRICAO || "",
      documento: imp.Documento || imp.documento || imp.DOCUMENTO || "",
      favorecido: imp.Favorecido || imp.favorecido || imp.FAVORECIDO || "",
      origem: "importado" as const,
      tipo: "Banco",
      original: imp
    };
  });

  const normalizadosPortal = basePortal.map(p => {
    const valor = Number(String(p.Valor || p.valor || p.VALOR || p.valor_lg || 0)
      .replace(/[^\d.,]/g, "").replace(",", "."));

    return {
      empresa: p.Empresa || p.empresa || p.EMPRESA || "",
      data: p.Data || p.data || p.DATA || p.data_credito || "",
      valor,
      banco: p.Banco || p.banco || p.BANCO || "",
      descricao: p.Descricao || p.descrição || p.DESCRICAO || p.celula || "",
      documento: p.Documento || p.documento || p.DOCUMENTO || "",
      favorecido: p.Favorecido || p.favorecido || p.FAVORECIDO || "",
      id: p.id,
      origem: "base" as const,
      tipo: "Portal",
      original: p
    };
  });

  const resultados: ConciliacaoItem[] = normalizadosBanco.map(imp => {
    const matches = normalizadosPortal.map(p => {
      let score = 0;
      if (p.empresa.toLowerCase() === imp.empresa.toLowerCase()) score += 20;
      if (Math.abs(p.valor - imp.valor) < 0.01) score += 40;
      
      const dataImp = new Date(imp.data);
      const dataP = new Date(p.data);
      const diffDays = isNaN(dataImp.getTime()) || isNaN(dataP.getTime()) ? 10 : Math.abs(differenceInDays(dataImp, dataP));
      
      if (diffDays === 0) score += 15;
      else if (diffDays <= 2) score += 10;
      
      if (p.banco && imp.banco && p.banco.toLowerCase() === imp.banco.toLowerCase()) score += 10;
      if (p.descricao && imp.descricao && p.descricao.toLowerCase().includes(imp.descricao.toLowerCase())) score += 5;
      if (p.documento && imp.documento && p.documento === imp.documento) score += 5;
      if (p.favorecido && imp.favorecido && p.favorecido.toLowerCase().includes(imp.favorecido.toLowerCase())) score += 5;

      return { item: p, score };
    }).sort((a, b) => b.score - a.score);

    const bestMatch = matches[0];

    if (bestMatch && bestMatch.score >= 75) {
      return { 
        ...imp, 
        matchId: bestMatch.item.id, 
        nivel: 1, 
        diferenca: 0,
        status: "Conciliado",
        score: bestMatch.score,
        valorPortal: bestMatch.item.valor
      };
    }

    if (bestMatch && bestMatch.score >= 40) {
      let motivo = "Divergência de valores ou data";
      const diff = imp.valor - bestMatch.item.valor;
      if (Math.abs(diff) < 20 && Math.abs(diff) > 0) motivo = "Possível tarifa bancária";
      else if (diff > 0 && diff < 100) motivo = "Possíveis juros/IOF";

      return { 
        ...imp, 
        matchId: bestMatch.item.id, 
        nivel: 3, 
        diferenca: diff,
        status: "Divergente",
        motivoDivergencia: motivo,
        score: bestMatch.score,
        valorPortal: bestMatch.item.valor
      };
    }

    return { 
      ...imp, 
      matchId: null, 
      nivel: 5, 
      diferenca: imp.valor,
      status: "Pendente",
      score: 0,
      valorPortal: 0
    };
  });

  const wb = XLSX.utils.book_new();
  
  const ws1Data = resultados.map(r => ({
    "Data": r.data,
    "Empresa": r.empresa,
    "Banco": r.banco,
    "Descrição": r.descricao,
    "Valor Banco": r.valor,
    "Valor Portal": r.valorPortal || 0,
    "Diferença": r.diferenca,
    "Status": r.status,
    "Motivo": r.motivoDivergencia || "",
    "Confiança (%)": r.score
  }));
  
  const ws1 = XLSX.utils.json_to_sheet(ws1Data);
  XLSX.utils.book_append_sheet(wb, ws1, "Conciliação Geral");

  const fileName = `conciliacao-bancaria-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`;
  XLSX.writeFile(wb, fileName);

  const { notificarArquivoPronto } = await import("./notificacoes-arquivos");
  await notificarArquivoPronto(
    `Conciliação Bancária Concluída`,
    `O processamento inteligente de ${resultados.length} registros foi finalizado.`,
    userId
  );

  return resultados;
}

export async function exportarConciliacaoSemanal(
  dataIni: string,
  dataFim: string,
  userId: string,
  formato: "xlsx" | "csv" = "xlsx"
) {
  const { data, error } = await supabase
    .from("pagamentos_diversos")
    .select("*")
    .gte("data_credito", dataIni)
    .lte("data_credito", dataFim);

  if (error) throw error;

  const ws = XLSX.utils.json_to_sheet(data || []);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pagamentos Filtrados");
  
  const extension = formato === "xlsx" ? "xlsx" : "csv";
  const fileName = `conciliacao-semanal-${dataIni}-a-${dataFim}.${extension}`;
  
  if (formato === "xlsx") {
    XLSX.writeFile(wb, fileName);
  } else {
    XLSX.writeFile(wb, fileName, { bookType: "csv" });
  }

  const { notificarArquivoPronto } = await import("./notificacoes-arquivos");
  await notificarArquivoPronto(
    "Relatório de Conciliação Pronto",
    `O arquivo filtrado (${extension.toUpperCase()}) de ${dataIni} a ${dataFim} foi gerado.`,
    userId
  );
  
  return data;
}

export async function exportarResultadosParaPDF(
  resultados: ConciliacaoItem[],
  dataIni: string,
  dataFim: string
) {
  // Como estamos em um ambiente de Worker/Edge, não temos bibliotecas de PDF nativas pesadas.
  // Vamos simular a geração ou usar uma abordagem de impressão.
  // No frontend, usaremos window.print() ou uma lib leve se disponível.
  console.log("Exportando PDF para o período:", dataIni, "a", dataFim);
  return true;
}
