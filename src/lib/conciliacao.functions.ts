import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const getPagamentosParaConciliacao = createServerFn({ method: "GET" })
  .validator((data) => z.object({
    competencias: z.array(z.string()),
  }).parse(data))
  .handler(async ({ data }) => {
    const { data: pagamentos, error } = await supabase
      .from("pagamentos_diversos")
      .select("*")
      .in("competencia", data.competencias);
    
    if (error) throw new Error(error.message);
    return pagamentos;
  });

export const saveConciliacaoHistorico = createServerFn({ method: "POST" })
  .validator((data) => z.object({
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
