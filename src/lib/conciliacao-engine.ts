import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { format, differenceInDays } from "date-fns";
import { classifyConciliacao, normalizeDate, normalizeMoney, normalizeText, type ConciliacaoStatusV290 } from "./v290-core.functions";

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
  statusDetalhado?: ConciliacaoStatusV290;
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

  const { data: fechadas, error: err2 } = await supabase.from("fechamento_pagamentos").select("mes");
  if (err2) throw err2;

  const todas = new Set<string>();
  ativas?.forEach((r) => r.competencia && todas.add(r.competencia));
  fechadas?.forEach((r) => r.mes && todas.add(r.mes));
  return Array.from(todas).sort().reverse();
}

function normalizarBanco(imp: any) {
  return {
    empresa: String(imp.Empresa ?? imp.empresa ?? imp.EMPRESA ?? ""),
    data: normalizeDate(imp.Data ?? imp.data ?? imp.DATA ?? imp["Data Crédito"]),
    valor: normalizeMoney(imp.Valor ?? imp.valor ?? imp.VALOR ?? imp["Valor Total"]),
    banco: String(imp.Banco ?? imp.banco ?? imp.BANCO ?? ""),
    descricao: String(imp.Descricao ?? imp.descrição ?? imp.DESCRICAO ?? ""),
    documento: String(imp.Documento ?? imp.documento ?? imp.DOCUMENTO ?? ""),
    favorecido: String(imp.Favorecido ?? imp.favorecido ?? imp.FAVORECIDO ?? ""),
    cpf_cnpj: String(imp.CPF ?? imp.CNPJ ?? imp["CPF/CNPJ"] ?? imp.cpf_cnpj ?? ""),
    agencia: String(imp.Agencia ?? imp.agência ?? imp.AGENCIA ?? ""),
    conta: String(imp.Conta ?? imp.conta ?? imp.CONTA ?? ""),
    statusBanco: String(imp.Status ?? imp.status ?? imp.Situacao ?? imp.situacao ?? ""),
    origem: "importado" as const,
    tipo: "Banco",
    original: imp,
  };
}

function normalizarPortal(p: any) {
  return {
    empresa: String(p.Empresa ?? p.empresa ?? p.EMPRESA ?? ""),
    data: normalizeDate(p.Data ?? p.data ?? p.DATA ?? p.data_credito),
    valor: normalizeMoney(p.Valor ?? p.valor ?? p.VALOR ?? p.valor_lg),
    banco: String(p.Banco ?? p.banco ?? p.BANCO ?? ""),
    descricao: String(p.Descricao ?? p.descrição ?? p.DESCRICAO ?? p.celula ?? ""),
    documento: String(p.Documento ?? p.documento ?? p.DOCUMENTO ?? ""),
    favorecido: String(p.Favorecido ?? p.favorecido ?? p.FAVORECIDO ?? ""),
    cpf_cnpj: String(p.cpf_cnpj ?? p.CPF ?? p.CNPJ ?? ""),
    agencia: String(p.agencia ?? p.Agencia ?? p.agência ?? ""),
    conta: String(p.conta ?? p.Conta ?? ""),
    id: p.id,
    origem: "base" as const,
    tipo: "Portal",
    original: p,
  };
}

export async function executarConciliacao(importados: any[], basePortal: any[], userId: string): Promise<ConciliacaoItem[]> {
  const normalizadosBanco = importados.map(normalizarBanco);
  const normalizadosPortal = basePortal.map(normalizarPortal);

  const resultados: ConciliacaoItem[] = normalizadosBanco.map((imp) => {
    const matches = normalizadosPortal
      .map((p) => {
        let score = 0;
        const sameIdentity = normalizeText(p.empresa) === normalizeText(imp.empresa) &&
          ((p.documento && imp.documento && normalizeText(p.documento) === normalizeText(imp.documento)) ||
            (!p.documento || !imp.documento));
        if (normalizeText(p.empresa) === normalizeText(imp.empresa)) score += 10;
        if (Math.abs(p.valor - imp.valor) < 0.01) score += 30;
        const dataImp = new Date(imp.data);
        const dataP = new Date(p.data);
        const diffDays = Number.isNaN(dataImp.getTime()) || Number.isNaN(dataP.getTime()) ? 10 : Math.abs(differenceInDays(dataImp, dataP));
        if (diffDays === 0) score += 15;
        else if (diffDays <= 2) score += 10;
        else if (diffDays <= 5) score += 5;
        if (p.documento && imp.documento && normalizeText(p.documento) === normalizeText(imp.documento)) score += 15;
        if (p.cpf_cnpj && imp.cpf_cnpj && p.cpf_cnpj.replace(/\D/g, "") === imp.cpf_cnpj.replace(/\D/g, "")) score += 15;
        if (p.banco && imp.banco && normalizeText(p.banco) === normalizeText(imp.banco)) score += 4;
        if (p.agencia && imp.agencia && normalizeText(p.agencia) === normalizeText(imp.agencia)) score += 3;
        if (p.conta && imp.conta && normalizeText(p.conta) === normalizeText(imp.conta)) score += 3;
        if (p.favorecido && imp.favorecido && normalizeText(p.favorecido).includes(normalizeText(imp.favorecido))) score += 5;
        else if (p.descricao && imp.descricao && normalizeText(p.descricao).includes(normalizeText(imp.descricao))) score += 3;
        return { item: p, score, sameIdentity, sameDate: diffDays === 0, sameValue: Math.abs(p.valor - imp.valor) < 0.01 };
      })
      .sort((a, b) => b.score - a.score);

    const bestMatch = matches[0];
    const detailedStatus = classifyConciliacao({
      hasMatch: Boolean(bestMatch),
      sameValue: Boolean(bestMatch?.sameValue),
      sameDate: Boolean(bestMatch?.sameDate),
      sameIdentity: Boolean(bestMatch?.sameIdentity),
      bankStatus: imp.statusBanco,
    });

    const isExact = detailedStatus === "Conciliado" || detailedStatus === "Aprovado/Efetivado";
    const isRejected = detailedStatus === "Rejeitado/Devolvido";
    const diff = bestMatch ? imp.valor - bestMatch.item.valor : imp.valor;

    let motivo = "";
    if (detailedStatus === "Diferença de valor") motivo = "Divergência de valor";
    else if (detailedStatus === "Diferença de data") motivo = "Divergência de data";
    else if (detailedStatus === "Diferença de empresa/documento") motivo = "Dados de identificação incompatíveis";
    else if (detailedStatus === "Não encontrado") motivo = "Registro do Controle de Pagamentos sem correspondência no Extrato";
    else if (isRejected) motivo = "Pagamento rejeitado/devolvido pelo banco";

    return {
      ...imp,
      matchId: bestMatch?.item.id ?? null,
      nivel: isExact ? 1 : isRejected ? 4 : bestMatch ? 3 : 5,
      diferenca: diff,
      status: isExact ? "Conciliado" : isRejected ? "Recusado" : bestMatch ? "Divergente" : "Pendente",
      statusDetalhado: detailedStatus,
      motivoDivergencia: motivo,
      score: bestMatch?.score ?? 0,
      valorPortal: bestMatch?.item.valor ?? 0,
      sugestao: matches.slice(0, 3).map((m) => ({ ...m.item, score: m.score, diferenca: imp.valor - m.item.valor } as ConciliacaoItem)),
    };
  });

  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(resultados.map((r) => ({
      "Data Banco": r.data,
      Empresa: r.empresa,
      Banco: r.banco,
      Agência: r.agencia || "",
      Conta: r.conta || "",
      Favorecido: r.favorecido || "",
      "CPF/CNPJ": r.cpf_cnpj || "",
      Documento: r.documento || "",
      Descrição: r.descricao,
      "Valor Banco": r.valor,
      "Valor Portal": r.valorPortal || 0,
      Diferença: r.diferenca,
      Status: r.statusDetalhado || r.status,
      Motivo: r.motivoDivergencia || "",
      "Confiança (%)": r.score,
    })));
    XLSX.utils.book_append_sheet(wb, ws, "Conciliação Geral");
    XLSX.writeFile(wb, `conciliacao-bancaria-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`);

    const { notificarArquivoPronto } = await import("./notificacoes-arquivos");
    await notificarArquivoPronto("Conciliação Bancária Concluída", `O processamento inteligente de ${resultados.length} registros foi finalizado.`, userId);
  } catch (err) {
    console.error("Erro ao gerar arquivo de exportação após conciliação:", err);
  }

  return resultados;
}

export async function exportarConciliacaoSemanal(dataIni: string, dataFim: string, userId: string, formato: "xlsx" | "csv" = "xlsx") {
  const { data, error } = await supabase.from("pagamentos_diversos").select("*").gte("data_credito", dataIni).lte("data_credito", dataFim);
  if (error) throw error;
  const ws = XLSX.utils.json_to_sheet((data || []).map((d) => ({ ...d, data_credito: d.data_credito ? format(new Date(d.data_credito), "dd/MM/yyyy") : "", valor_lg: d.valor_lg || 0 })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pagamentos Filtrados");
  const extension = formato === "xlsx" ? "xlsx" : "csv";
  XLSX.writeFile(wb, `conciliacao-semanal-${dataIni}-a-${dataFim}.${extension}`, formato === "xlsx" ? undefined : { bookType: "csv" });
  const { notificarArquivoPronto } = await import("./notificacoes-arquivos");
  await notificarArquivoPronto("Relatório de Conciliação Pronto", `O arquivo filtrado (${extension.toUpperCase()}) de ${dataIni} a ${dataFim} foi gerado.`, userId);
  return data;
}

export async function exportarResultadosParaPDF(resultados: ConciliacaoItem[], dataIni: string, dataFim: string) {
  console.log("Exportando PDF para o período:", dataIni, "a", dataFim, "registros:", resultados.length);
  return true;
}
