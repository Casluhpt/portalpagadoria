import { useRoles, type AppRole } from "@/hooks/use-roles";
import type { ReactNode } from "react";

interface RoleGateProps {
  role?: AppRole;
  anyOf?: AppRole[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGate({ role, anyOf, fallback = null, children }: RoleGateProps) {
  const { has, hasAny, loading } = useRoles();
  if (loading) return null;
  const allowed = role ? has(role) : anyOf ? hasAny(anyOf) : false;
  return <>{allowed ? children : fallback}</>;
}
