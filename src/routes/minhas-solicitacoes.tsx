import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, Inbox, Plus } from "lucide-react";

import { PortalHeader } from "@/components/portal-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useIdentidade, validateEmail, validateNome } from "@/hooks/use-identidade";
import {
  listarPorEmail,
  STATUS_CLASS,
  STATUS_LABEL,
  TIPO_LABEL,
  type Solicitacao,
} from "@/lib/solicitacoes";

export const Route = createFileRoute("/minhas-solicitacoes")({
  head: () => ({ meta: [{ title: "Minhas solicitações — Portal Pagadoria/ADP" }] }),
  component: MinhasPage,
});

function MinhasPage() {
  const { identidade, hydrated, save } = useIdentidade();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Solicitacao[] | null>(null);

  useEffect(() => {
    if (hydrated && identidade) {
      setNome(identidade.nome);
      setEmail(identidade.email);
      buscar(identidade.nome, identidade.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, identidade?.email]);

  async function buscar(n: string, e: string) {
    const nErr = validateNome(n);
    const eErr = validateEmail(e);
    if (nErr) return toast.error(nErr);
    if (eErr) return toast.error(eErr);
    save({ nome: n, email: e });
    setLoading(true);
    try {
      const data = await listarPorEmail(e);
      setRows(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao consultar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <PortalHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Minhas solicitações</h1>
            <p className="text-sm text-slate-500">
              Informe nome e e-mail para listar as demandas que você abriu.
            </p>
          </div>
          <Button asChild className="bg-violet-600 hover:bg-violet-700">
            <Link to="/nova-solicitacao">
              <Plus className="mr-1.5 h-4 w-4" />
              Nova solicitação
            </Link>
          </Button>
        </div>

        <Card className="mb-6 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base text-slate-800">Consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                buscar(nome, email);
              }}
              className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <div className="space-y-1.5">
                <Label htmlFor="q-nome">Nome</Label>
                <Input
                  id="q-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome Sobrenome"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-email">E-mail</Label>
                <Input
                  id="q-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@profarma.com.br"
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700">
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Consultar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {rows === null ? null : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Inbox className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm text-slate-600">
              Nenhuma solicitação encontrada para <span className="font-medium">{email}</span>.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Código</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium">Assunto</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Aberta em</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{r.codigo}</td>
                    <td className="px-4 py-3 text-slate-700">{TIPO_LABEL[r.tipo]}</td>
                    <td className="px-4 py-3 text-slate-800">{r.assunto}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[r.status]}`}
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(r.criado_em).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/solicitacao/$id"
                        params={{ id: r.id }}
                        className="text-sm font-medium text-violet-700 hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
