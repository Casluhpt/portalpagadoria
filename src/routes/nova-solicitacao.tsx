import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

import { PortalHeader } from "@/components/portal-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIdentidade } from "@/hooks/use-identidade";
import { criarSolicitacao, TIPO_LABEL, type SolicitacaoTipo } from "@/lib/solicitacoes";

export const Route = createFileRoute("/nova-solicitacao")({
  head: () => ({ meta: [{ title: "Nova solicitação — Portal Pagadoria/ADP" }] }),
  component: NovaSolicitacaoPage,
});

function NovaSolicitacaoPage() {
  const navigate = useNavigate();
  const { identidade, hydrated } = useIdentidade();
  const [tipo, setTipo] = useState<SolicitacaoTipo | "">("");
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hydrated && !identidade) {
      navigate({ to: "/identificar", search: { redirect: "/nova-solicitacao" }, replace: true });
    }
  }, [hydrated, identidade, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identidade) return;
    if (!tipo) return toast.error("Selecione o tipo da solicitação.");
    if (assunto.trim().length < 3) return toast.error("Descreva o assunto (mín. 3 caracteres).");
    if (descricao.trim().length < 10) return toast.error("Detalhe a descrição (mín. 10 caracteres).");

    setSaving(true);
    try {
      const created = await criarSolicitacao({
        solicitante_nome: identidade.nome,
        solicitante_email: identidade.email,
        tipo: tipo as SolicitacaoTipo,
        assunto: assunto.trim(),
        descricao: descricao.trim(),
      });
      toast.success(`Solicitação ${created.codigo} registrada`);
      navigate({ to: "/solicitacao/$id", params: { id: created.id } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao registrar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50">
      <PortalHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">Nova solicitação</CardTitle>
            <p className="text-sm text-slate-500">
              Envie sua demanda à equipe da Pagadoria/ADP. Você receberá um código único para acompanhamento.
            </p>
          </CardHeader>
          <CardContent>
            {identidade && (
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Registrando como <span className="font-medium text-slate-800">{identidade.nome}</span>{" "}
                <span className="text-slate-500">({identidade.email})</span>
              </div>
            )}
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as SolicitacaoTipo)}>
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecione o tipo da solicitação" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TIPO_LABEL) as SolicitacaoTipo[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {TIPO_LABEL[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assunto">Assunto</Label>
                <Input
                  id="assunto"
                  type="text"
                  required
                  maxLength={140}
                  placeholder="Ex.: Divergência no holerite de janeiro"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  required
                  rows={6}
                  maxLength={4000}
                  placeholder="Descreva a demanda com o máximo de detalhes possível."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
                <p className="text-xs text-slate-500">{descricao.length}/4000</p>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar solicitação
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
