import { supabase } from "@/integrations/supabase/client";

export type MaterialApoio = {
  id: string;
  titulo: string;
  categoria: string;
  resumo: string | null;
  conteudo: string;
  palavras_chave: string[];
  ordem: number;
  publicado: boolean;
  criado_por_nome: string | null;
  created_at: string;
  updated_at: string;
};

export const materialApoioQueryKey = ["material_apoio"] as const;

export async function fetchMateriais(): Promise<MaterialApoio[]> {
  const { data, error } = await supabase
    .from("material_apoio")
    .select("*")
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MaterialApoio[];
}

export type MaterialInput = {
  titulo: string;
  categoria: string;
  resumo: string;
  conteudo: string;
  palavras_chave: string[];
  publicado: boolean;
  ordem: number;
};

export async function createMaterial(input: MaterialInput, autor: string | null) {
  const { error } = await supabase.from("material_apoio").insert({
    ...input,
    criado_por_nome: autor,
  });
  if (error) throw error;
}

export async function updateMaterial(id: string, input: Partial<MaterialInput>) {
  const { error } = await supabase.from("material_apoio").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteMaterial(id: string) {
  const { error } = await supabase.from("material_apoio").delete().eq("id", id);
  if (error) throw error;
}

/** Simple relevance scoring used by the support search box. */
export function rankMateriais(materiais: MaterialApoio[], term: string) {
  const q = term.trim().toLowerCase();
  if (!q) return materiais;
  const words = q.split(/\s+/).filter(Boolean);
  return materiais
    .map((m) => {
      const haystack = [
        m.titulo,
        m.categoria,
        m.resumo ?? "",
        m.conteudo,
        (m.palavras_chave ?? []).join(" "),
      ]
        .join(" \n ")
        .toLowerCase();
      let score = 0;
      for (const w of words) {
        if (m.titulo.toLowerCase().includes(w)) score += 5;
        if ((m.palavras_chave ?? []).some((k) => k.toLowerCase().includes(w))) score += 4;
        if ((m.resumo ?? "").toLowerCase().includes(w)) score += 2;
        if (haystack.includes(w)) score += 1;
      }
      return { m, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.m);
}

/* ---------- Favoritos (por usuário) ---------- */

export const favoritosMaterialQueryKey = ["material_apoio_favoritos"] as const;

export async function fetchFavoritos(userId: string | null | undefined): Promise<string[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("material_apoio_favoritos")
    .select("material_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.material_id as string);
}

export async function favoritarMaterial(userId: string, materialId: string) {
  const { error } = await supabase
    .from("material_apoio_favoritos")
    .insert({ user_id: userId, material_id: materialId });
  if (error && error.code !== "23505") throw error;
}

export async function desfavoritarMaterial(userId: string, materialId: string) {
  const { error } = await supabase
    .from("material_apoio_favoritos")
    .delete()
    .eq("user_id", userId)
    .eq("material_id", materialId);
  if (error) throw error;
}
