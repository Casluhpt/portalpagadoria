import { supabase } from "@/integrations/supabase/client";

export type PortalHit = {
  id: string;
  titulo: string;
  detalhe: string;
  grupo:
    | "Usuários"
    | "Colaboradores"
    | "Empresas"
    | "Fornecedores"
    | "Competências"
    | "Despesas Fixas"
    | "Material de Apoio";
  url: string;
};

const uniqBy = <T,>(arr: T[], key: (t: T) => string) => {
  const seen = new Set<string>();
  return arr.filter((i) => {
    const k = key(i);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/**
 * Busca total do portal: usuários, colaboradores/matrículas, empresas,
 * fornecedores, competências, despesas fixas e material de apoio.
 */
export async function buscarNoPortal(term: string): Promise<PortalHit[]> {
  const q = term.trim();
  if (q.length < 2) return [];
  // Sanitiza caracteres com significado especial na sintaxe de filtros do PostgREST
  // (`,` separa condições, `()` agrupa, `%`/`*` são curingas) antes de interpolar.
  const safe = q.replace(/[,()%*\\"']/g, " ").replace(/\s+/g, " ").trim();
  if (safe.length < 2) return [];
  const like = `%${safe}%`;

  const [usuarios, pagamentos, fornecedores, despesas, materiais] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nome, email, setor")
      .or(`nome.ilike.${like},email.ilike.${like},setor.ilike.${like}`)
      .limit(6),
    supabase
      .from("pagamentos_diversos")
      .select("id, colaborador_nome, empresa, competencia, banco, valor_lg")
      .or(
        `colaborador_nome.ilike.${like},empresa.ilike.${like},competencia.ilike.${like},banco.ilike.${like},descricao_pagamento.ilike.${like}`,
      )
      .limit(12),
    supabase
      .from("lancamentos")
      .select("id, supplier, empresa, invoice_number, pre_pedido")
      .or(`supplier.ilike.${like},empresa.ilike.${like},invoice_number.ilike.${like}`)
      .limit(10),
    supabase
      .from("despesas_fixas")
      .select("id, descricao, categoria, empresa_nome, numero_pedido, ano, mes")
      .or(
        `descricao.ilike.${like},categoria.ilike.${like},empresa_nome.ilike.${like},numero_pedido.ilike.${like}`,
      )
      .limit(10),
    supabase
      .from("material_apoio")
      .select("id, titulo, categoria, resumo")
      .or(`titulo.ilike.${like},categoria.ilike.${like},resumo.ilike.${like},conteudo.ilike.${like}`)
      .limit(6),
  ]);

  const hits: PortalHit[] = [];

  for (const u of usuarios.data ?? []) {
    hits.push({
      id: `user-${u.id}`,
      titulo: u.nome ?? u.email ?? "Usuário",
      detalhe: [u.email, u.setor].filter(Boolean).join(" · "),
      grupo: "Usuários",
      url: "/usuarios",
    });
  }

  for (const p of pagamentos.data ?? []) {
    if (p.colaborador_nome) {
      hits.push({
        id: `colab-${p.id}`,
        titulo: p.colaborador_nome,
        detalhe: [p.empresa, p.competencia, p.banco].filter(Boolean).join(" · "),
        grupo: "Colaboradores",
        url: "/pagamentos",
      });
    }
  }

  for (const e of uniqBy(
    (pagamentos.data ?? []).filter((p) => p.empresa),
    (p) => String(p.empresa),
  )) {
    hits.push({
      id: `empresa-${e.empresa}`,
      titulo: String(e.empresa),
      detalhe: "Empresa com pagamentos registrados",
      grupo: "Empresas",
      url: "/pagamentos",
    });
  }

  for (const c of uniqBy(
    (pagamentos.data ?? []).filter((p) => p.competencia),
    (p) => String(p.competencia),
  )) {
    hits.push({
      id: `comp-${c.competencia}`,
      titulo: `Competência ${c.competencia}`,
      detalhe: "Base de pagamentos e provisão",
      grupo: "Competências",
      url: "/fechamento",
    });
  }

  for (const f of fornecedores.data ?? []) {
    hits.push({
      id: `forn-${f.id}`,
      titulo: f.supplier ?? f.empresa ?? "Fornecedor",
      detalhe: [f.empresa, f.invoice_number ? `NF ${f.invoice_number}` : null, f.pre_pedido ? `Pedido ${f.pre_pedido}` : null]
        .filter(Boolean)
        .join(" · "),
      grupo: "Fornecedores",
      url: "/base",
    });
  }

  for (const d of despesas.data ?? []) {
    hits.push({
      id: `desp-${d.id}`,
      titulo: d.descricao,
      detalhe: [d.categoria, d.empresa_nome, d.numero_pedido, `${String(d.mes).padStart(2, "0")}/${d.ano}`]
        .filter(Boolean)
        .join(" · "),
      grupo: "Despesas Fixas",
      url: "/despesas-fixas",
    });
  }

  for (const m of materiais.data ?? []) {
    hits.push({
      id: `mat-${m.id}`,
      titulo: m.titulo,
      detalhe: [m.categoria, m.resumo].filter(Boolean).join(" · "),
      grupo: "Material de Apoio",
      url: "/material-apoio",
    });
  }

  return uniqBy(hits, (h) => h.id).slice(0, 40);
}
