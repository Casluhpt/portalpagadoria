import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export type PresenceStatus = "online" | "ausente" | "offline";

export const ALLOWED_SETORES = ["FOLHA/FÉRIAS", "RESCISÃO", "BENEFICIOS", "PAGADORIA", "GERENTE", "VISITANTE"] as const;
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
  const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "administrador",
  });
  
  const { data: isGerente, error: gerenteError } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "gerente",
  });

  if (roleError || gerenteError) throw new Error("Falha ao validar permissão");
  if (!isAdmin && !isGerente) throw new Error("Acesso restrito a administradores e gerentes");
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
  .validator((input: { email: string; redirectTo?: string }) => {
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

const ALLOWED_ROLES = ["administrador", "auditor", "operacional", "criador_competencia", "consulta", "viewer", "visitante", "gerente"] as const;

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { userId: string; role: AppRole }) => {
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
    
    // Obter dados do usuário para auditoria
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("nome, email, setor")
      .eq("id", data.userId)
      .single();

    const { data: oldRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    const roleAnterior = oldRoles?.[0]?.role ?? "Nenhuma";

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

    // Auditoria obrigatória para alteração de perfil
    try {
      const { logAcaoCritica } = await import("@/lib/audit-critico");
      await logAcaoCritica({
        acao: "alteracao_permissao",
        modulo: "Administração de Usuários",
        tabela: "user_roles",
        registro_id: data.userId,
        descricao: `Alteração de perfil: ${roleAnterior} -> ${data.role}`,
        metadata: {
          alvo_id: data.userId,
          alvo_nome: profile?.nome,
          alvo_email: profile?.email,
          perfil_anterior: roleAnterior,
          perfil_novo: data.role,
          setor_atual: profile?.setor
        },
        severidade: data.role === "administrador" ? "critico" : "alerta"
      });
    } catch (auditErr) {
      console.warn("[audit] falha ao registrar alteração de perfil", auditErr);
    }

    return { ok: true };
  });

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { email: string; role: AppRole; nome?: string; redirectTo?: string }) => {
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
  .validator((input: { userId: string }) => {
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
  .validator((input: { userId: string; setor: Setor | null }) => {
    if (!input?.userId) throw new Error("userId é obrigatório");
    if (input.setor !== null && !(ALLOWED_SETORES as readonly string[]).includes(input.setor)) {
      throw new Error("Setor inválido");
    }
    // O setor PAGADORIA é restrito e a função já possui middleware requireSupabaseAuth + assertAdmin
    return input;
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: oldProfile } = await supabaseAdmin
      .from("profiles")
      .select("setor, nome, email")
      .eq("id", data.userId)
      .single();

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ setor: data.setor })
      .eq("id", data.userId);
    if (error) throw error;

    // Auditoria obrigatória para alteração de setor (especialmente Pagadoria)
    try {
      const { logAcaoCritica } = await import("@/lib/audit-critico");
      await logAcaoCritica({
        acao: "alteracao_permissao",
        modulo: "Administração de Usuários",
        tabela: "profiles",
        registro_id: data.userId,
        descricao: `Alteração de setor: ${oldProfile?.setor ?? "Nenhum"} -> ${data.setor ?? "Nenhum"}`,
        metadata: {
          alvo_id: data.userId,
          alvo_nome: oldProfile?.nome,
          alvo_email: oldProfile?.email,
          setor_anterior: oldProfile?.setor,
          setor_novo: data.setor
        },
        severidade: data.setor === "PAGADORIA" || oldProfile?.setor === "PAGADORIA" ? "alerta" : "info"
      });
    } catch (auditErr) {
      console.warn("[audit] falha ao registrar alteração de setor", auditErr);
    }

    return { ok: true };
  });

export const setUserNome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { userId: string; nome: string | null }) => {
    if (!input?.userId) throw new Error("userId é obrigatório");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Update profile
    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .update({ nome: data.nome })
      .eq("id", data.userId);
    if (profErr) throw profErr;

    // Update auth metadata
    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      user_metadata: { nome: data.nome }
    });
    if (authErr) throw authErr;

    return { ok: true };
  });

export const getAppModules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("app_modules")
      .select("*")
      .order("name");
    
    if (error) throw error;
    return data;
  });

export const getUserModules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("user_modules")
      .select("module_id")
      .eq("user_id", userId);
    
    if (error) throw error;
    return data.map((m: any) => m.module_id);
  });

export const toggleUserModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { userId: string; moduleId: string; enabled: boolean }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    if (data.enabled) {
      const { error } = await supabaseAdmin
        .from("user_modules")
        .insert({ user_id: data.userId, module_id: data.moduleId });
      if (error && error.code !== "23505") throw error; // Ignore duplicates
    } else {
      const { error } = await supabaseAdmin
        .from("user_modules")
        .delete()
        .eq("user_id", data.userId)
        .eq("module_id", data.moduleId);
      if (error) throw error;
    }
    
    return { success: true };
  });

export const getUserSpecificPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("user_specific_permissions")
      .select("*")
      .eq("user_id", userId);
    
    if (error) throw error;
    return data;
  });

export const setUserSpecificPermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { userId: string; resource: string; action: string; isAllowed: boolean }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_specific_permissions")
      .upsert({
        user_id: data.userId,
        resource: data.resource,
        action: data.action,
        is_allowed: data.isAllowed,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,resource,action" });
    
    if (error) throw error;
    return { success: true };
  });

export const removeUserSpecificPermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { userId: string; resource: string; action: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_specific_permissions")
      .delete()
      .eq("user_id", data.userId)
      .eq("resource", data.resource)
      .eq("action", data.action);
    
    if (error) throw error;
    return { success: true };
  });

