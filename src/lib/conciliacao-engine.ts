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
  cpf_cnpj?: string;
  agencia?: string;
  conta?: string;
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
      empresa: String(imp.Empresa || imp.empresa || imp.EMPRESA || ""),
      data: imp.Data || imp.data || imp.DATA || imp["Data Crédito"] || "",
      valor,
      banco: String(imp.Banco || imp.banco || imp.BANCO || ""),
      descricao: String(imp.Descricao || imp.descrição || imp.DESCRICAO || ""),
      documento: String(imp.Documento || imp.documento || imp.DOCUMENTO || ""),
      favorecido: String(imp.Favorecido || imp.favorecido || imp.FAVORECIDO || ""),
      cpf_cnpj: String(imp.CPF || imp.CNPJ || imp["CPF/CNPJ"] || imp.cpf_cnpj || ""),
      agencia: String(imp.Agencia || imp.agência || imp.AGENCIA || ""),
      conta: String(imp.Conta || imp.conta || imp.CONTA || ""),
      origem: "importado" as const,
      tipo: "Banco",
      original: imp
    };
  });

  const normalizadosPortal = basePortal.map(p => {
    const valor = Number(String(p.Valor || p.valor || p.VALOR || p.valor_lg || 0)
      .replace(/[^\d.,]/g, "").replace(",", "."));

    return {
      empresa: String(p.Empresa || p.empresa || p.EMPRESA || ""),
      data: p.Data || p.data || p.DATA || p.data_credito || "",
      valor,
      banco: String(p.Banco || p.banco || p.BANCO || ""),
      descricao: String(p.Descricao || p.descrição || p.DESCRICAO || p.celula || ""),
      documento: String(p.Documento || p.documento || p.DOCUMENTO || ""),
      favorecido: String(p.Favorecido || p.favorecido || p.FAVORECIDO || ""),
      cpf_cnpj: String(p.cpf_cnpj || ""),
      agencia: String(p.agencia || ""),
      conta: String(p.conta || ""),
      id: p.id,
      origem: "base" as const,
      tipo: "Portal",
      original: p
    };
  });

  const resultados: ConciliacaoItem[] = normalizadosBanco.map(imp => {
    const matches = normalizadosPortal.map(p => {
      let score = 0;
      
      // 1. Empresa (Peso 10)
      if (p.empresa.toLowerCase() === imp.empresa.toLowerCase()) score += 10;
      
      // 2. Valor (Peso 30)
      if (Math.abs(p.valor - imp.valor) < 0.01) score += 30;
      
      // 3. Data (Peso 15)
      const dataImp = new Date(imp.data);
      const dataP = new Date(p.data);
      const diffDays = isNaN(dataImp.getTime()) || isNaN(dataP.getTime()) ? 10 : Math.abs(differenceInDays(dataImp, dataP));
      if (diffDays === 0) score += 15;
      else if (diffDays <= 2) score += 10;
      else if (diffDays <= 5) score += 5;
      
      // 4. Documento (Peso 15)
      if (p.documento && imp.documento && p.documento === imp.documento) score += 15;
      
      // 5. CPF/CNPJ (Peso 15)
      if (p.cpf_cnpj && imp.cpf_cnpj && p.cpf_cnpj.replace(/\D/g, '') === imp.cpf_cnpj.replace(/\D/g, '')) score += 15;
      
      // 6. Banco / Agencia / Conta (Peso 10)
      if (p.banco && imp.banco && p.banco.toLowerCase() === imp.banco.toLowerCase()) score += 4;
      if (p.agencia && imp.agencia && p.agencia === imp.agencia) score += 3;
      if (p.conta && imp.conta && p.conta === imp.conta) score += 3;

      // 7. Favorecido / Descrição (Peso 5)
      if (p.favorecido && imp.favorecido && p.favorecido.toLowerCase().includes(imp.favorecido.toLowerCase())) score += 5;
      else if (p.descricao && imp.descricao && p.descricao.toLowerCase().includes(imp.descricao.toLowerCase())) score += 3;

      return { item: p, score };
    }).sort((a, b) => b.score - a.score);

    const bestMatch = matches[0];

    // Nível 1: Exata (Score >= 85)
    if (bestMatch && bestMatch.score >= 85) {
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

    // Nível 3: Divergente / Aproximada (Score >= 40)
    if (bestMatch && bestMatch.score >= 40) {
      let motivo = "Divergência de valores ou data";
      const diff = imp.valor - bestMatch.item.valor;
      
      // Detecção inteligente de tarifas/juros
      if (Math.abs(diff) < 20 && Math.abs(diff) > 0) motivo = "Possível tarifa bancária";
      else if (diff > 0 && diff < 100) motivo = "Possíveis juros/IOF";
      else if (Math.abs(diff) > 0.01) motivo = "Divergência de valor significativo";

      return { 
        ...imp, 
        matchId: bestMatch.item.id, 
        nivel: 3, 
        diferenca: diff,
        status: "Divergente",
        motivoDivergencia: motivo,
        score: bestMatch.score,
        valorPortal: bestMatch.item.valor,
        sugestao: matches.slice(0, 3).map(m => ({
          ...m.item,
          score: m.score,
          diferenca: imp.valor - m.item.valor
        } as any))
      };
    }

    // Nível 5: Pendente (Sem correspondência clara)
    return { 
      ...imp, 
      matchId: null, 
      nivel: 5, 
      diferenca: imp.valor,
      status: "Pendente",
      score: bestMatch?.score || 0,
      valorPortal: 0
    };
  });

  try {
    const wb = XLSX.utils.book_new();
    const ws1Data = resultados.map(r => ({
      "Data Banco": r.data,
      "Empresa": r.empresa,
      "Banco": r.banco,
      "Agência": r.agencia || "",
      "Conta": r.conta || "",
      "Favorecido": r.favorecido || "",
      "CPF/CNPJ": r.cpf_cnpj || "",
      "Documento": r.documento || "",
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
  } catch (err) {
    console.error("Erro ao gerar arquivo de exportação após conciliação:", err);
  }

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

  const wsData = (data || []).map(d => ({
    ...d,
    data_credito: d.data_credito ? format(new Date(d.data_credito), "dd/MM/yyyy") : "",
    valor_lg: d.valor_lg || 0
  }));

  const ws = XLSX.utils.json_to_sheet(wsData);
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
  console.log("Exportando PDF para o período:", dataIni, "a", dataFim);
  // O PDF é gerado via window.print() no cliente por questões de performance/runtime
  return true;
}
