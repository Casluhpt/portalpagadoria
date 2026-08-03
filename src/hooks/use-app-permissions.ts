import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPermissions } from "@/lib/permissions.functions";
import { useRoles } from "@/hooks/use-roles";

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'import' | 'export' | 'execute';

export function useAppPermissions() {
  // As permissões reais vivem em public.user_roles (não em user_metadata).
  const { roles, isAdmin, loading: rolesLoading } = useRoles();
  const getPermsFn = useServerFn(getPermissions);

  const { data: permissions, isLoading, isError } = useQuery({
    queryKey: ["app-permissions"],
    queryFn: () => getPermsFn(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });

  const hasPermission = (resource: string, action: PermissionAction): boolean => {
    // Administrador tem tudo, a menos que haja bloqueio explícito.
    if (isAdmin) {
      const explicitDeny = permissions?.find(
        (p) =>
          (p.role === 'administrador' || p.role === 'admin') &&
          p.resource === resource &&
          p.action === action &&
          p.is_allowed === false,
      );
      return !explicitDeny;
    }

    // Enquanto carrega (ou se a matriz falhar), não escondemos a navegação:
    // o backend/RLS continua sendo a autoridade final.
    if (rolesLoading || isLoading || isError || !permissions) return true;

    if (roles.length === 0) return true;

    // Permitido se QUALQUER papel do usuário permitir o recurso/ação.
    const matches = permissions.filter(
      (p) => roles.includes(p.role as never) && p.resource === resource && p.action === action,
    );
    if (matches.length === 0) return true; // sem regra definida => não bloqueia a UI
    return matches.some((p) => p.is_allowed);
  };

  return {
    hasPermission,
    isLoading: rolesLoading || isLoading,
    role: roles[0],
  };
}
