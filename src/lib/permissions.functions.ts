import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getPermissions = createServerFn({ method: "GET" })
  .handler(async () => {
    // Usando any para contornar temporariamente a falta de sincronização do type-gen
    const { data, error } = await (supabaseAdmin.from("app_permissions") as any)
      .select("*");
    if (error) throw error;
    return data;
  });

export const updatePermission = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    role: z.string(),
    resource: z.string(),
    action: z.string(),
    is_allowed: z.boolean()
  }))
  .handler(async ({ data }) => {
    const { error } = await (supabaseAdmin.from("app_permissions") as any)
      .upsert({
        role: data.role,
        resource: data.resource,
        action: data.action,
        is_allowed: data.is_allowed
      }, { onConflict: 'role,resource,action' });

    if (error) throw error;
    return { success: true };
  });
