import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ROTAS_PUBLICAS = ["/auth", "/forgot-password", "/reset-password"];

const isPublica = (pathname: string) =>
  ROTAS_PUBLICAS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export function AuthGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const pathname = location.pathname;
  const [autenticado, setAutenticado] = useState<boolean | null>(null);

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (ativo) setAutenticado(!!data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAutenticado(!!session);
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (autenticado === false && !isPublica(pathname)) {
      const returnTo = `${pathname}${location.searchStr ?? ""}${location.hash ?? ""}`;
      navigate({
        to: "/auth",
        search: returnTo === "/" ? undefined : { returnTo },
        replace: true,
      });
    }
  }, [autenticado, pathname, location.searchStr, location.hash, navigate]);


  if (isPublica(pathname)) return <>{children}</>;

  if (autenticado !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
