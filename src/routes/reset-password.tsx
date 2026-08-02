import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, KeyRound, CheckCircle2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import profarmaLogo from "@/assets/profarma-logo.png.asset.json";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "USER_UPDATED") {
        setReady(true);
        setLinkError(null);
      }
    });

    const validate = async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

      // Erro devolvido pelo próprio link (expirado / já utilizado)
      const errDesc = url.searchParams.get("error_description") ?? hash.get("error_description");
      if (errDesc) {
        if (!cancelled) setLinkError(decodeURIComponent(errDesc));
        return;
      }

      // 1) Sessão já existente (link em hash processado pelo client)
      const { data: current } = await supabase.auth.getSession();
      if (current.session) {
        if (!cancelled) setReady(true);
        return;
      }

      // 2) Fluxo PKCE: ?code=...
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) {
          if (error) setLinkError(error.message);
          else setReady(true);
        }
        return;
      }

      // 3) Fluxo token_hash: ?token_hash=...&type=recovery
      const tokenHash = url.searchParams.get("token_hash") ?? url.searchParams.get("token");
      const type = (url.searchParams.get("type") ?? "recovery") as "recovery" | "email";
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (!cancelled) {
          if (error) setLinkError(error.message);
          else setReady(true);
        }
        return;
      }

      // 4) Tokens no hash (#access_token=...&refresh_token=...)
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!cancelled) {
          if (error) setLinkError(error.message);
          else setReady(true);
        }
        return;
      }

      if (!cancelled) {
        setLinkError(
          "Link de recuperação inválido ou expirado. Solicite um novo email de redefinição.",
        );
      }
    };

    void validate();
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Senha precisa de ao menos 8 caracteres.");
    if (password !== confirm) return toast.error("As senhas não coincidem.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    // Marca a data da troca de senha para a política de expiração (60 dias)
    try { await supabase.rpc("mark_password_changed" as never); } catch { /* ignore */ }
    await supabase.auth.signOut();
    setLoading(false);
    toast.success("Senha alterada com sucesso.");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-background p-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="items-center text-center">
          <img src={profarmaLogo.url} alt="Profarma" className="mb-2 h-10" />
          <CardTitle className="text-xl text-foreground">Nova senha</CardTitle>
          <p className="text-sm text-muted-foreground">Defina uma nova senha para acessar o portal.</p>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Validando link de recuperação…
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="rp-pw">Nova senha (mín. 8)</Label>
                <PasswordInput
                  id="rp-pw"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rp-pw2">Confirmar nova senha</Label>
                <PasswordInput
                  id="rp-pw2"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                {confirm && password !== confirm && (
                  <p className="text-xs text-red-600">As senhas não coincidem.</p>
                )}
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Salvar nova senha
              </Button>
              <p className="flex items-center justify-center text-xs text-muted-foreground">
                <KeyRound className="mr-1 h-3 w-3" />
                Após salvar você voltará para a tela de login.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
