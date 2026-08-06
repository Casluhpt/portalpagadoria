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
  matchId?: string;
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
) {
  // A inteligência do sistema deve identificar automaticamente o tipo de arquivo
  // Mas para o processamento, tratamos 'importados' como a extração bancária
  // e 'basePortal' como o arquivo gerado pelo Portal (ou dados da DB)

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

  const resultados = normalizadosBanco.map(imp => {
    // 3. Conciliação inteligente
    // Comparação considerando Empresa, Banco, Data, Valor, Descrição, Documento, Favorecido

    const matches = normalizadosPortal.map(p => {
      let score = 0;
      if (p.empresa.toLowerCase() === imp.empresa.toLowerCase()) score += 20;
      if (p.valor === imp.valor) score += 40;
      
      const dataImp = new Date(imp.data);
      const dataP = new Date(p.data);
      const diffDays = Math.abs(differenceInDays(dataImp, dataP));
      
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
        status: "Conciliado" as const,
        score: bestMatch.score
      };
    }

    if (bestMatch && bestMatch.score >= 40) {
      // 8. Inteligência para identificação das diferenças
      let motivo = "Divergência de valores ou data";
      const diff = imp.valor - bestMatch.item.valor;
      if (Math.abs(diff) < 20) motivo = "Possível tarifa bancária";
      else if (diff > 0 && diff < 100) motivo = "Possíveis juros/IOF";

      return { 
        ...imp, 
        matchId: bestMatch.item.id, 
        nivel: 3, 
        diferenca: diff,
        status: "Divergente" as const,
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
      status: "Pendente" as const,
      score: 0
    };
  });

  // 2. Gerar Excel com os resultados
  const wb = XLSX.utils.book_new();
  
  const ws1Data = resultados.map(r => ({
    "Data": r.data,
    "Empresa": r.empresa,
    "Banco": r.banco,
    "Descrição": r.descricao,
    "Valor Banco": r.valor,
    "Valor Portal": (r as any).valorPortal || 0,
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
  userId: string
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
  
  const fileName = `conciliacao-semanal-${dataIni}-a-${dataFim}.xlsx`;
  XLSX.writeFile(wb, fileName);

  const { notificarArquivoPronto } = await import("./notificacoes-arquivos");
  await notificarArquivoPronto(
    "Relatório de Conciliação Pronto",
    `O arquivo filtrado de ${dataIni} a ${dataFim} foi gerado.`,
    userId
  );
  
  return data;
}
