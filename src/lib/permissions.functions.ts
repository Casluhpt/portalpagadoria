import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface AppPermission {
  id: string;
  role: string;
  resource: string;
  action: string;
  is_allowed: boolean;
}

export const getPermissions = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("app_permissions" as any)
      .select("*");
    
    if (error) throw error;
    return (data as any) as AppPermission[];
  });

export const updatePermission = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    role: z.string(),
    resource: z.string(),
    action: z.string(),
    is_allowed: z.boolean()
  }))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("app_permissions" as any)
      .upsert({
        role: data.role,
        resource: data.resource,
        action: data.action,
        is_allowed: data.is_allowed
      }, { onConflict: 'role,resource,action' });

    if (error) throw error;
    return { success: true };
  });
