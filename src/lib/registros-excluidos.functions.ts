import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RegistroExcluido = {
  id: string;
  origem: "pagamento" | "lancamento";
  registro_id: string | null;
  user_nome: string | null;
  created_at: string;
  snapshot: Record<string, any> | null;
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "administrador",
  });
  if (error) throw new Error("Falha ao validar permissão");
  if (!data) throw new Error("Acesso restrito a administradores");
}

export const listRegistrosExcluidos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RegistroExcluido[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: pagRows, error: pagErr }, { data: lancRows, error: lancErr }] = await Promise.all([
      supabaseAdmin
        .from("pagamentos_audit")
        .select("id, pagamento_id, user_nome, snapshot, created_at")
        .eq("acao", "DELETE")
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("lancamentos_audit")
        .select("id, lancamento_id, user_nome, snapshot, created_at")
        .eq("acao", "DELETE")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);
    if (pagErr) throw pagErr;
    if (lancErr) throw lancErr;

    const pag: RegistroExcluido[] = (pagRows ?? []).map((r: any) => ({
      id: r.id,
      origem: "pagamento",
      registro_id: r.pagamento_id ?? null,
      user_nome: r.user_nome ?? null,
      created_at: r.created_at,
      snapshot: r.snapshot ?? null,
    }));
    const lanc: RegistroExcluido[] = (lancRows ?? []).map((r: any) => ({
      id: r.id,
      origem: "lancamento",
      registro_id: r.lancamento_id ?? null,
      user_nome: r.user_nome ?? null,
      created_at: r.created_at,
      snapshot: r.snapshot ?? null,
    }));
    return [...pag, ...lanc].sort((a, b) => b.created_at.localeCompare(a.created_at));
  });
