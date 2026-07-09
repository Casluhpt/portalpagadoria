import { createFileRoute, useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, UserCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import profarmaLogo from "@/assets/profarma-logo.png.asset.json";
import { useIdentidade, validateEmail, validateNome } from "@/hooks/use-identidade";

export const Route = createFileRoute("/identificar")({
  head: () => ({
    meta: [{ title: "Identificar-se — Portal Pagadoria/ADP" }],
  }),
  component: IdentificarPage,
});

function IdentificarPage() {
  const navigate = useNavigate();
  const { identidade, hydrated, save } = useIdentidade();
  const search = useRouterState({ select: (s) => s.location.search }) as { redirect?: string };

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [nomeErr, setNomeErr] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && identidade) {
      setNome(identidade.nome);
      setEmail(identidade.email);
    }
  }, [hydrated, identidade]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = validateNome(nome);
    const em = validateEmail(email);
    setNomeErr(n);
    setEmailErr(em);
    if (n || em) return;
    save({ nome, email });
    toast.success("Identificação salva");
    const target = typeof search.redirect === "string" ? search.redirect : "/nova-solicitacao";
    navigate({ to: target, replace: true });
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-br from-slate-100 via-slate-100 to-violet-100 p-4">
      <Card className="w-full max-w-md border-slate-200 shadow-lg">
        <CardHeader className="items-center text-center">
          <img src={profarmaLogo.url} alt="Profarma" className="mb-2 h-10" />
          <CardTitle className="text-xl text-slate-800">Identifique-se</CardTitle>
          <p className="text-sm text-slate-500">
            Informe nome e e-mail corporativo para abrir e acompanhar suas solicitações.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                type="text"
                required
                autoComplete="name"
                placeholder="Ex.: Lucas Lima"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  if (nomeErr) setNomeErr(validateNome(e.target.value));
                }}
                onBlur={() => setNomeErr(validateNome(nome))}
                aria-invalid={!!nomeErr}
              />
              {nomeErr && <p className="text-xs text-red-600">{nomeErr}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="usuario@profarma.com.br"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailErr) setEmailErr(validateEmail(e.target.value));
                }}
                onBlur={() => setEmailErr(validateEmail(email))}
                aria-invalid={!!emailErr}
              />
              {emailErr && <p className="text-xs text-red-600">{emailErr}</p>}
            </div>
            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">
              <UserCheck className="mr-2 h-4 w-4" />
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-center text-xs text-slate-500">
              <Link to="/" className="text-violet-700 hover:underline">
                Voltar ao portal
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
