import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/profarma-logo.png.asset.json";

export const LOGO_SETTINGS_KEY = "logos_portal";

export type LogoArea =
  | "global"
  | "sidebar"
  | "header"
  | "login"
  | "favicon"
  | "relatorios";

export interface LogoAreaInfo {
  area: LogoArea;
  titulo: string;
  descricao: string;
  ondeAparece: string[];
  recomendacao: string;
}

/** Catálogo de todos os locais do portal que exibem um PNG. */
export const LOGO_AREAS: LogoAreaInfo[] = [
  {
    area: "global",
    titulo: "PNG Global (padrão)",
    descricao:
      "Imagem usada em todas as áreas que não possuem um PNG próprio configurado.",
    ondeAparece: [
      "Todas as telas do portal (fallback)",
      "Cabeçalhos dos módulos",
      "Telas sem PNG específico",
    ],
    recomendacao: "PNG com fundo transparente, altura mínima de 120px.",
  },
  {
    area: "sidebar",
    titulo: "Barra Lateral",
    descricao: "PNG exibido no topo do menu lateral esquerdo.",
    ondeAparece: ["Menu lateral (todas as telas)"],
    recomendacao: "Formato horizontal, fundo transparente.",
  },
  {
    area: "header",
    titulo: "Cabeçalho dos Módulos",
    descricao:
      "PNG exibido no cabeçalho superior das telas internas do portal.",
    ondeAparece: [
      "Resultados Principais",
      "Provisão Diária",
      "Pagamentos Diversos",
      "Conciliação Bancária",
      "Despesas Fixas / eSocial / Auditoria",
      "Configurações",
    ],
    recomendacao: "Formato horizontal, boa leitura em 28px de altura.",
  },
  {
    area: "login",
    titulo: "Tela de Login",
    descricao: "PNG principal da tela de autenticação e primeiro acesso.",
    ondeAparece: ["Tela de login", "Criação de conta", "Redefinição de senha"],
    recomendacao: "Versão maior/destacada da marca.",
  },
  {
    area: "favicon",
    titulo: "Ícone do Navegador (favicon)",
    descricao: "Ícone exibido na aba do navegador e nos favoritos.",
    ondeAparece: ["Aba do navegador", "Favoritos", "Atalhos na área de trabalho"],
    recomendacao: "PNG quadrado (ex.: 64x64 ou 128x128).",
  },
  {
    area: "relatorios",
    titulo: "Relatórios e Exportações",
    descricao: "PNG aplicado nos relatórios executivos em PDF e exportações.",
    ondeAparece: ["Relatórios PDF", "Exportações de Resultados Principais"],
    recomendacao: "PNG com fundo branco ou transparente, alta resolução.",
  },
];

export type LogosMap = Partial<Record<LogoArea, string>>;

export function useLogos() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["portal-logos"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<LogosMap> => {
      const { data, error } = await supabase
        .from("portal_settings")
        .select("value")
        .eq("key", LOGO_SETTINGS_KEY)
        .maybeSingle();
      if (error) return {};
      return ((data?.value as LogosMap | null) ?? {}) as LogosMap;
    },
  });

  const logos = query.data ?? {};

  const resolve = (area: LogoArea = "global") =>
    logos[area] || logos.global || logoAsset.url;

  const salvar = async (next: LogosMap) => {
    const { error } = await supabase.from("portal_settings").upsert(
      { key: LOGO_SETTINGS_KEY, value: next, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ["portal-logos"] });
  };

  return {
    logos,
    loading: query.isLoading,
    resolve,
    salvar,
    padrao: logoAsset.url,
  };
}
