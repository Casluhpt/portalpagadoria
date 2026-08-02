import { useRoles, type AppRole } from "@/hooks/use-roles";
import { useEffect, useRef, type ReactNode } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { logAcaoCritica } from "@/lib/audit-critico";

interface RoleGateProps {
  role?: AppRole;
  anyOf?: AppRole[];
  fallback?: ReactNode;
  /** Nome da área restrita — quando informado, o acesso negado é registrado na trilha de auditoria. */
  area?: string;
  children: ReactNode;
}

export function RoleGate({ role, anyOf, fallback = null, area, children }: RoleGateProps) {
  const { has, hasAny, loading } = useRoles();
  const allowed = role ? has(role) : anyOf ? hasAny(anyOf) : false;
  const logado = useRef(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading || allowed || !area || logado.current) return;
    logado.current = true;
    void logAcaoCritica({
      acao: "acesso_negado",
      modulo: area,
      descricao: `Tentativa de acesso à área restrita "${area}"`,
      metadata: { rota: pathname, perfil_exigido: role ?? anyOf ?? null },
      severidade: "critico",
    });
  }, [loading, allowed, area, pathname, role, anyOf]);

  if (loading) return null;
  return <>{allowed ? children : fallback}</>;
}

/**
 * Bloqueia acesso direto por URL a áreas restritas: valida o perfil,
 * registra a tentativa negada e exibe a mensagem de bloqueio.
 */
export function RestrictedArea({
  area,
  anyOf,
  role,
  children,
}: {
  area: string;
  anyOf?: AppRole[];
  role?: AppRole;
  children: ReactNode;
}) {
  const { has, hasAny, loading } = useRoles();
  const allowed = role ? has(role) : anyOf ? hasAny(anyOf) : false;
  const logado = useRef(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading || allowed || logado.current) return;
    logado.current = true;
    void logAcaoCritica({
      acao: "acesso_negado",
      modulo: area,
      descricao: `Acesso negado por URL à área restrita "${area}"`,
      metadata: { rota: pathname },
      severidade: "critico",
    });
  }, [loading, allowed, area, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <h2 className="text-lg font-semibold">Área restrita</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Você não possui permissão para acessar <strong>{area}</strong>. A tentativa foi
          registrada na trilha de auditoria com data, hora e usuário.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/principal">Voltar à tela principal</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
