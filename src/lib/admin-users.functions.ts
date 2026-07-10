import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PresenceStatus = "online" | "ausente" | "offline";

export type AdminUserRow = {
  id: string;
  email: string | null;
  nome: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  last_seen_at: string | null;
  presence: PresenceStatus;
  roles: string[];
  online: boolean;
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "administrador",
  });
  if (error) throw new Error("Falha ao validar permissão");
  if (!data) throw new Error("Acesso restrito a administradores");
}

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const users: any[] = [];
    let page = 1;
    const perPage = 200;
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      users.push(...(data?.users ?? []));
      if (!data?.users || data.users.length < perPage) break;
      page += 1;
      if (page > 25) break;
    }

    const ids = users.map((u) => u.id);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, nome").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    ]);

    const nomeById = new Map<string, string | null>();
    (profiles ?? []).forEach((p: any) => nomeById.set(p.id, p.nome ?? null));
    const rolesById = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = rolesById.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesById.set(r.user_id, arr);
    });

    const now = Date.now();
    return users.map((u) => {
      const last = u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : null;
      const online = last != null && now - last < 5 * 60 * 1000;
      return {
        id: u.id,
        email: u.email ?? null,
        nome: nomeById.get(u.id) ?? (u.user_metadata?.nome as string | undefined) ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        roles: rolesById.get(u.id) ?? [],
        online,
      };
    }).sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; redirectTo?: string }) => {
    if (!input?.email) throw new Error("Email é obrigatório");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(data.email, {
      redirectTo: data.redirectTo,
    });
    if (error) throw error;
    return { ok: true };
  });

const ALLOWED_ROLES = ["administrador", "viewer"] as const;

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: "administrador" | "viewer" }) => {
    if (!input?.userId) throw new Error("userId é obrigatório");
    if (!ALLOWED_ROLES.includes(input.role)) throw new Error("Perfil inválido");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId && data.role !== "administrador") {
      throw new Error("Você não pode remover seu próprio acesso de administrador.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: delErr } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .in("role", [...ALLOWED_ROLES]);
    if (delErr) throw delErr;
    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (insErr) throw insErr;
    return { ok: true };
  });
