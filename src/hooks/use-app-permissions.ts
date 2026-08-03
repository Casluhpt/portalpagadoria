import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPermissions } from "@/lib/permissions.functions";
import { useSession } from "@/hooks/use-session";

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'import' | 'export' | 'execute';

export function useAppPermissions() {
  const { role } = useSession();
  const getPermsFn = useServerFn(getPermissions);

  const { data: permissions, isLoading } = useQuery({
    queryKey: ["app-permissions"],
    queryFn: () => getPermsFn(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const hasPermission = (resource: string, action: PermissionAction): boolean => {
    // Admin tem tudo por padrão a menos que haja bloqueio explícito
    if (role === 'administrador' || role === 'admin') {
      const explicitDeny = permissions?.find(p => 
        (p.role === 'administrador' || p.role === 'admin') && 
        p.resource === resource && 
        p.action === action && 
        p.is_allowed === false
      );
      return !explicitDeny;
    }

    if (!role) return false;

    const perm = permissions?.find(p => p.role === role && p.resource === resource && p.action === action);
    return perm ? perm.is_allowed : false;
  };

  return {
    hasPermission,
    isLoading,
    role
  };
}
