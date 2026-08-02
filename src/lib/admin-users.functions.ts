import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PresenceStatus = "online" | "ausente" | "offline";

export const ALLOWED_SETORES = ["FOLHA/FÉRIAS", "RESCISÃO", "BENEFICIOS", "VISITANTE", "PAGADORIA", "GERÊNCIA/VISITANTE"] as const;
export type Setor = (typeof ALLOWED_SETORES)[number];

export type AdminUserRow = {
  id: string;
  email: string | null;
  nome: string | null;
  setor: Setor | null;
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
      supabaseAdmin.from("profiles").select("id, nome, setor, presence_status, last_seen_at").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    ]);

    const profileById = new Map<string, { nome: string | null; setor: Setor | null; presence: PresenceStatus; last_seen_at: string | null }>();
    (profiles ?? []).forEach((p: any) => profileById.set(p.id, {
      nome: p.nome ?? null,
      setor: (ALLOWED_SETORES as readonly string[]).includes(p.setor) ? (p.setor as Setor) : null,
      presence: (p.presence_status as PresenceStatus) ?? "offline",
      last_seen_at: p.last_seen_at ?? null,
    }));
    const rolesById = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = rolesById.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesById.set(r.user_id, arr);
    });

    const now = Date.now();
    return users.map((u) => {
      const prof = profileById.get(u.id);
      const lastSeen = prof?.last_seen_at ? new Date(prof.last_seen_at).getTime() : null;
      const fresh = lastSeen != null && now - lastSeen < 2 * 60 * 1000;
      // Consider stale "online" as ausente
      let presence: PresenceStatus = prof?.presence ?? "offline";
      if (presence === "online" && !fresh) presence = lastSeen != null ? "ausente" : "offline";
      return {
        id: u.id,
        email: u.email ?? null,
        nome: prof?.nome ?? (u.user_metadata?.nome as string | undefined) ?? null,
        setor: prof?.setor ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        last_seen_at: prof?.last_seen_at ?? null,
        presence,
        roles: rolesById.get(u.id) ?? [],
        online: presence === "online",
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

const ALLOWED_ROLES = ["administrador", "viewer", "visitante"] as const;

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: "administrador" | "viewer" | "visitante" }) => {
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

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; role: "administrador" | "viewer" | "visitante"; nome?: string; redirectTo?: string }) => {
    const email = (input?.email ?? "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email inválido");
    if (!ALLOWED_ROLES.includes(input.role)) throw new Error("Perfil inválido");
    return { email, role: input.role, nome: input.nome?.trim() || undefined, redirectTo: input.redirectTo };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: data.redirectTo,
      data: data.nome ? { nome: data.nome } : undefined,
    });
    if (error) throw error;

    const userId = invited?.user?.id;
    if (userId) {
      await supabaseAdmin.from("user_roles")
        .delete()
        .eq("user_id", userId)
        .in("role", [...ALLOWED_ROLES]);
      const { error: insErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: data.role });
      if (insErr) throw insErr;
    }

    return { ok: true, userId: userId ?? null };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (!input?.userId) throw new Error("userId é obrigatório");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) {
      throw new Error("Você não pode excluir sua própria conta.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const setUserSetor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; setor: Setor | null }) => {
    if (!input?.userId) throw new Error("userId é obrigatório");
    if (input.setor !== null && !(ALLOWED_SETORES as readonly string[]).includes(input.setor)) {
      throw new Error("Setor inválido");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ setor: data.setor })
      .eq("id", data.userId);
    if (error) throw error;
    return { ok: true };
  });
