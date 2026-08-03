import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getPermissions = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("app_permissions")
      .select("*");
    if (error) throw error;
    return data;
  });

export const updatePermission = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    role: z.enum(['admin', 'moderator', 'user', 'viewer', 'visitante'] as any),
    resource: z.string(),
    action: z.string(),
    is_allowed: z.boolean()
  }))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("app_permissions")
      .upsert({
        role: data.role,
        resource: data.resource,
        action: data.action,
        is_allowed: data.is_allowed
      }, { onConflict: 'role,resource,action' });

    if (error) throw error;
    return { success: true };
  });
