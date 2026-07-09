import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import profarmaLogo from "@/assets/profarma-logo.png.asset.json";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Link enviado para seu e-mail.");
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-br from-slate-100 via-slate-100 to-violet-100 p-4">
      <Card className="w-full max-w-md border-slate-200 shadow-lg">
        <CardHeader className="items-center text-center">
          <img src={profarmaLogo.url} alt="Profarma" className="mb-2 h-10" />
          <CardTitle className="text-xl text-slate-800">Recuperar senha</CardTitle>
          <p className="text-sm text-slate-500">
            Informe o e-mail cadastrado e enviaremos um link de recuperação.
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <Mail className="mx-auto mb-2 h-6 w-6" />
                Link de recuperação enviado para <strong>{email}</strong>. Confira sua caixa de
                entrada (e a pasta de spam).
              </div>
              <Button variant="outline" onClick={() => navigate({ to: "/auth" })} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para login
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="fp-email">E-mail</Label>
                <Input
                  id="fp-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Enviar link de recuperação
              </Button>
              <Link
                to="/auth"
                className="mt-2 flex items-center justify-center text-xs font-medium text-violet-700 hover:underline"
              >
                <ArrowLeft className="mr-1 h-3 w-3" /> Voltar para login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
