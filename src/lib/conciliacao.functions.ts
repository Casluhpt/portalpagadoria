import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const getPagamentosParaConciliacao = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({
    competencias: z.array(z.string()).optional(),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    let query = supabase.from("pagamentos_diversos").select("*");
    
    if (data.dataInicio && data.dataFim) {
      query = query.gte("data_credito", data.dataInicio).lte("data_credito", data.dataFim);
    } else if (data.competencias && data.competencias.length > 0) {
      query = query.in("competencia", data.competencias);
    }
    
    const { data: pagamentos, error } = await query;
    
    if (error) throw new Error(error.message);
    return pagamentos;
  });

export const saveConciliacaoHistorico = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    tipo: z.string(),
    nomenclatura: z.string().optional(),
    competencias_utilizadas: z.array(z.string()).optional(),
    periodo_inicio: z.string().optional(),
    periodo_fim: z.string().optional(),
    arquivo_importado_nome: z.string().optional(),
    resultado_sumario: z.any(),
    executado_por: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { data: inserted, error } = await supabase
      .from("conciliacao_historico")
      .insert([data])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return inserted;
  });

export const listConciliacaoHistorico = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("conciliacao_historico")
      .select("*")
      .order("executado_em", { ascending: false });
    
    if (error) throw new Error(error.message);
    return data;
  });
