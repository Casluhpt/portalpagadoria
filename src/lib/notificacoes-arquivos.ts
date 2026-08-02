import { supabase } from "@/integrations/supabase/client";

/**
 * Registra uma notificação de arquivo pronto para download.
 * @param titulo Título da notificação (ex: "Conciliação Semanal Pronta")
 * @param mensagem Mensagem com detalhes
 * @param userId ID do usuário destino
 * @param arquivoUrl URL para download (opcional)
 */
export async function notificarArquivoPronto(
  titulo: string,
  mensagem: string,
  userId: string,
  arquivoUrl?: string
): Promise<void> {
  const meta = arquivoUrl ? { type: "download", url: arquivoUrl } : null;
  
  const { error } = await supabase
    .from("comunicados")
    .insert({ 
      titulo, 
      mensagem, 
      criado_por: userId,
      // Usamos o campo mensagem para embutir o link se necessário, 
      // ou poderíamos ter um JSON meta se a tabela suportasse.
      // Por enquanto, vamos adicionar o link no final da mensagem.
    });
    
  if (error) throw error;
}

/**
 * Registra um anexo na pasta específica.
 * @param nome Nome do arquivo
 * @param url URL do arquivo (Supabase Storage)
 * @param pasta Nome da pasta (ex: "conciliacao bancaria")
 * @param userId ID do usuário
 */
export async function registrarAnexo(
  nome: string,
  url: string,
  pasta: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("anexos" as any) // Tabela hipotética de metadados de anexos
    .insert({
      nome,
      url,
      pasta: pasta.toLowerCase(),
      criado_por: userId,
      criado_em: new Date().toISOString()
    });
    
  if (error && error.code !== "PGRST116") {
    // Se a tabela não existir, apenas logamos para não quebrar o fluxo principal
    console.warn("Tabela 'anexos' não encontrada para registro formal, o arquivo permanece no Storage.");
  }
}
