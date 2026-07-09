import { createFileRoute, useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, LogIn, UserPlus, KeyRound } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import profarmaLogo from "@/assets/profarma-logo.png.asset.json";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

// "Nome Sobrenome": pelo menos 2 palavras, cada uma iniciando com maiúscula
// seguida de minúsculas/acentuadas. Aceita nomes compostos (mais de 2 palavras).
const NAME_REGEX = /^[A-ZÀ-Ý][a-zà-ÿ']+(?:\s+[A-ZÀ-Ý][a-zà-ÿ']+)+$/;

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const search = useRouterState({ select: (s) => s.location.search }) as {
    redirect?: string;
  };

  useEffect(() => {
    if (session) {
      const target = typeof search.redirect === "string" ? search.redirect : "/";
      navigate({ to: target, replace: true });
    }
  }, [session, navigate, search.redirect]);

  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-br from-slate-100 via-slate-100 to-violet-100 p-4">
      <Card className="w-full max-w-md border-slate-200 shadow-lg">
        <CardHeader className="items-center text-center">
          <img src={profarmaLogo.url} alt="Profarma" className="mb-2 h-10" />
          <CardTitle className="text-xl text-slate-800">Portal Pagadoria</CardTitle>
          <p className="text-sm text-slate-500">Acesse para editar as bases de dados.</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignInForm /></TabsContent>
            <TabsContent value="signup"><SignUpForm /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Sessão iniciada");
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="si-email">E-mail</Label>
        <Input
          id="si-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="si-pw">Senha</Label>
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-violet-700 hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>
        <Input
          id="si-pw"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
        Entrar
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [nomeError, setNomeError] = useState<string | null>(null);

  const validateNome = (value: string) => {
    const trimmed = value.trim().replace(/\s+/g, " ");
    if (!trimmed.includes(" ")) return "Informe o nome no padrão Nome Sobrenome.";
    if (!NAME_REGEX.test(trimmed)) return "Informe o nome no padrão Nome Sobrenome (primeira letra de cada palavra maiúscula).";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNome = nome.trim().replace(/\s+/g, " ");
    const nameErr = validateNome(trimmedNome);
    if (nameErr) {
      setNomeError(nameErr);
      return toast.error(nameErr);
    }
    if (password.length < 8) return toast.error("Senha precisa de ao menos 8 caracteres.");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { nome: trimmedNome },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada — você já pode entrar.");
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="su-nome">Nome completo</Label>
        <Input
          id="su-nome"
          type="text"
          required
          autoComplete="name"
          placeholder="Ex.: Lucas Lima"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            if (nomeError) setNomeError(validateNome(e.target.value));
          }}
          onBlur={() => setNomeError(validateNome(nome))}
          aria-invalid={!!nomeError}
        />
        {nomeError && <p className="text-xs text-red-600">{nomeError}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-email">E-mail</Label>
        <Input
          id="su-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-pw">Senha (mín. 8)</Label>
        <Input
          id="su-pw"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
        Criar conta
      </Button>
      <p className="text-center text-xs text-slate-500">
        <KeyRound className="mr-1 inline h-3 w-3" />
        Ao criar conta você recebe acesso de consulta; um administrador libera edição.
      </p>
    </form>
  );
}
