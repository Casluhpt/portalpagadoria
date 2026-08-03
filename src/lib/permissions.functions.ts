import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AppPermission {
  id: string;
  role: string;
  resource: string;
  action: string;
  is_allowed: boolean;
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "administrador",
  });
  if (error) throw new Error("Falha ao validar permissão");
  if (!data) throw new Error("Acesso restrito a administradores");
}

// Leitura: qualquer usuário autenticado precisa da matriz para montar a navegação.
export const getPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("app_permissions")
      .select("id, role, resource, action, is_allowed");

    if (error) throw error;
    return (data ?? []) as AppPermission[];
  });

// Escrita: exclusiva de administradores.
export const updatePermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    role: z.string().min(1).max(50),
    resource: z.string().min(1).max(100),
    action: z.string().min(1).max(50),
    is_allowed: z.boolean(),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("app_permissions" as any)
      .upsert({
        role: data.role,
        resource: data.resource,
        action: data.action,
        is_allowed: data.is_allowed,
      }, { onConflict: 'role,resource,action' });

    if (error) throw error;

    await context.supabase.rpc("registrar_acao_critica", {
      _acao: "alteracao_permissao",
      _modulo: "Gestão de Acessos",
      _tabela: "app_permissions",
      _descricao: `Permissão ${data.resource}.${data.action} para ${data.role} = ${data.is_allowed}`,
      _severidade: "alerta",
    });

    return { success: true };
  });
