import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const url = new URL(window.location.href);
      const redirect = url.searchParams.get("redirect") || "/";

      // O Supabase processa automaticamente o hash/search na URL para estabelecer a sessão
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        toast.error("Erro na verificação do link: " + error.message);
        navigate({ to: "/auth", replace: true });
        return;
      }

      if (data.session) {
        toast.success("Link verificado com sucesso!");
        navigate({ to: redirect as any, replace: true });
      } else {
        // Caso não haja sessão imediata, redireciona para o login
        navigate({ to: "/auth", replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-4 text-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h1 className="text-xl font-semibold">Processando verificação...</h1>
        <p className="text-muted-foreground">Estamos confirmando seus dados para liberar seu acesso.</p>
      </div>
    </div>
  );
}
