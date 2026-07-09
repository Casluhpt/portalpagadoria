import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MessageSquarePlus } from "lucide-react";

import { PortalHeader } from "@/components/portal-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useIdentidade } from "@/hooks/use-identidade";
import {
  comentarComoSolicitante,
  listarUpdates,
  obterSolicitacao,
  STATUS_CLASS,
  STATUS_LABEL,
  TIPO_LABEL,
  type Solicitacao,
  type SolicitacaoUpdate,
} from "@/lib/solicitacoes";

export const Route = createFileRoute("/solicitacao/$id")({
  head: () => ({ meta: [{ title: "Solicitação — Portal Pagadoria/ADP" }] }),
  component: SolicitacaoPage,
});

function SolicitacaoPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { identidade, hydrated } = useIdentidade();

  const [sol, setSol] = useState<Solicitacao | null | undefined>(undefined);
  const [updates, setUpdates] = useState<SolicitacaoUpdate[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    try {
      const [s, u] = await Promise.all([obterSolicitacao(id), listarUpdates(id)]);
      setSol(s);
      setUpdates(u);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!identidade) {
      return navigate({
        to: "/identificar",
        search: { redirect: `/solicitacao/${id}` },
      });
    }
    if (mensagem.trim().length < 3) return toast.error("Escreva uma mensagem.");
    setSending(true);
    try {
      await comentarComoSolicitante({
        solicitacao_id: id,
        autor_nome: identidade.nome,
        autor_email: identidade.email,
        mensagem: mensagem.trim(),
      });
      setMensagem("");
      await load();
      toast.success("Comentário enviado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao comentar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <PortalHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/minhas-solicitacoes"
          className="mb-4 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar
        </Link>

        {sol === undefined ? (
          <div className="grid place-items-center py-20 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : sol === null ? (
          <Card className="border-slate-200">
            <CardContent className="py-10 text-center text-slate-600">
              Solicitação não encontrada.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-slate-500">{sol.codigo}</p>
                    <CardTitle className="text-xl text-slate-800">{sol.assunto}</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      {TIPO_LABEL[sol.tipo]} · aberta em{" "}
                      {new Date(sol.criado_em).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[sol.status]}`}
                  >
                    {STATUS_LABEL[sol.status]}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Solicitante</p>
                  <p className="font-medium text-slate-800">{sol.solicitante_nome}</p>
                  <p className="text-slate-500">{sol.solicitante_email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Descrição</p>
                  <p className="mt-1 whitespace-pre-wrap">{sol.descricao}</p>
                </div>
              </CardContent>
            </Card>

            <section className="mt-6">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Histórico</h2>
              {updates.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  Nenhuma atualização ainda. Aguarde o retorno da Pagadoria/ADP.
                </p>
              ) : (
                <ul className="space-y-3">
                  {updates.map((u) => (
                    <li
                      key={u.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-medium text-slate-700">
                          {u.autor_tipo === "pagadoria_adp" ? "Pagadoria/ADP" : u.autor_nome}
                        </span>
                        <span>{new Date(u.criado_em).toLocaleString("pt-BR")}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{u.mensagem}</p>
                      {u.novo_status && (
                        <p className="mt-2 text-xs text-slate-500">
                          Status alterado para{" "}
                          <span className="font-medium text-slate-700">
                            {STATUS_LABEL[u.novo_status]}
                          </span>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <Card className="mt-6 border-slate-200">
              <CardHeader>
                <CardTitle className="text-base text-slate-800">Adicionar comentário</CardTitle>
              </CardHeader>
              <CardContent>
                {hydrated && !identidade && (
                  <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Você precisa se identificar para comentar.
                  </p>
                )}
                <form onSubmit={submit} className="space-y-3">
                  <Textarea
                    rows={4}
                    maxLength={2000}
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Escreva uma atualização, dúvida ou informação adicional."
                  />
                  <Button
                    type="submit"
                    disabled={sending}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {sending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquarePlus className="mr-2 h-4 w-4" />
                    )}
                    Enviar comentário
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
