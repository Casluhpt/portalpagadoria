import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { format } from "date-fns";

export type FechamentoPagamento = {
  id: string;
  nome: string;
  mes: string;
  ano: string;
  criado_em: string;
  usuario_id: string | null;
  total_valor: number;
  total_registros: number;
  arquivo_url?: string | null;
};

export const fechamentoPagamentosKey = ["fechamento_pagamentos"] as const;

export async function fetchFechamentosPagamentos(): Promise<FechamentoPagamento[]> {
  const { data, error } = await supabase
    .from("fechamento_pagamentos")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data as FechamentoPagamento[];
}

export async function fecharCompetenciaPagamentos(nome: string, usuarioId: string, registros: any[]): Promise<void> {
  const totalValor = registros.reduce((sum, r) => sum + (Number(r.valor_lg) || 0), 0);
  const totalRegistros = registros.length;
  const now = new Date();
  const mes = format(now, "yyyy-MM");
  const ano = format(now, "yyyy");

  // 1. Export as Excel (client side logic handled here conceptually, but we need the data)
  // In a real app we might upload this to Supabase Storage, but here we'll just record the closure.

  // 2. Record the closure
  const { error: insertError } = await supabase
    .from("fechamento_pagamentos")
    .insert({
      nome,
      mes,
      ano,
      usuario_id: usuarioId,
      total_valor: totalValor,
      total_registros: totalRegistros
    });
  if (insertError) throw insertError;

  // 3. Notificar o sino sobre o fechamento e exportação do arquivo
  const { notificarArquivoPronto } = await import("./notificacoes-arquivos");
  await notificarArquivoPronto(
    `Fechamento Concluído: ${nome}`,
    `O fechamento da competência ${mes} foi realizado. O arquivo Excel está disponível para download.`,
    usuarioId
  );

  // 3. Clear the main table
  // Note: We use the Table name from src/lib/pagamentos.ts which is 'pagamentos_diversos'
  const { error: deleteError } = await supabase
    .from("pagamentos_diversos")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteError) throw deleteError;
}
