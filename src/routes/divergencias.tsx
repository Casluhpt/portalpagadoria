import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronRight, Loader2, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

import { useRoles } from "@/hooks/use-roles";
import { supabase } from "@/integrations/supabase/client";

import {
  aprovarSolicitacao, fetchSolicitacoes, rejeitarSolicitacao, solicitacoesKey,
  type PagamentoSolicitacao, type StatusSolicitacao,
} from "@/lib/provisao-fechamento";
import { pagamentosQueryKey } from "@/lib/pagamentos";

export const Route = createFileRoute("/divergencias")({
  component: DivergenciasPage,
});

const brl = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return String(v ?? "");
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};
const fmtDate = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
const fmtDT = (iso: string) => new Date(iso).toLocaleString("pt-BR");

function DivergenciasPage() {
  const { isAdmin } = useRoles();
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: solicitacoesKey,
    queryFn: fetchSolicitacoes,
    staleTime: 15_000,
  });

  useEffect(() => {
    const ch = supabase
      .channel("solicitacoes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pagamento_solicitacoes" }, () => {
        qc.invalidateQueries({ queryKey: solicitacoesKey });
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [qc]);

  const [tab, setTab] = useState<StatusSolicitacao>("pendente");
  const groups = useMemo(() => {
    return {
      pendente: data.filter((s) => s.status === "pendente"),
      aprovada: data.filter((s) => s.status === "aprovada"),
      rejeitada: data.filter((s) => s.status === "rejeitada"),
    };
  }, [data]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div>
              <h1 className="text-sm font-semibold text-foreground">Central de Divergências</h1>
              <p className="text-xs text-muted-foreground">
                Solicitações de lançamento em dias com provisão já fechada.
              </p>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as StatusSolicitacao)}>
              <TabsList>
                <TabsTrigger value="pendente" className="gap-2">
                  Pendentes
                  <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-white">
                    {groups.pendente.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="aprovada">Aprovadas ({groups.aprovada.length})</TabsTrigger>
                <TabsTrigger value="rejeitada">Rejeitadas ({groups.rejeitada.length})</TabsTrigger>
              </TabsList>

              {(["pendente", "aprovada", "rejeitada"] as const).map((k) => (
                <TabsContent key={k} value={k} className="mt-4 space-y-3">
                  {isLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                    </div>
                  )}
                  {!isLoading && groups[k].length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center text-sm text-muted-foreground">
                        Nenhuma solicitação {k === "pendente" ? "pendente" : k === "aprovada" ? "aprovada" : "rejeitada"}.
                      </CardContent>
                    </Card>
                  )}
                  {groups[k].map((s) => (
                    <SolicitacaoCard key={s.id} solicitacao={s} isAdmin={isAdmin} />
                  ))}
                </TabsContent>
              ))}
            </Tabs>

            {!isAdmin && groups.pendente.length > 0 && (
              <div className="mt-6 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                Apenas administradores podem aprovar ou rejeitar solicitações.
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function SolicitacaoCard({ solicitacao, isAdmin }: { solicitacao: PagamentoSolicitacao; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<null | "aprovar" | "rejeitar">(null);
  const [motivo, setMotivo] = useState("");

  const decideMut = useMutation({
    mutationFn: async () => {
      if (decision === "aprovar") await aprovarSolicitacao(solicitacao.id, motivo || undefined);
      else if (decision === "rejeitar") await rejeitarSolicitacao(solicitacao.id, motivo || undefined);
    },
    onSuccess: () => {
      toast.success(decision === "aprovar" ? "Solicitação aprovada e pagamento criado." : "Solicitação rejeitada.");
      qc.invalidateQueries({ queryKey: solicitacoesKey });
      qc.invalidateQueries({ queryKey: pagamentosQueryKey });
      setDecision(null);
      setMotivo("");
    },
    onError: (e: Error) => toast.error("Falha: " + e.message),
  });

  const p = solicitacao.payload ?? {};
  const statusColor =
    solicitacao.status === "pendente" ? "bg-amber-100 text-amber-800 border-amber-300"
    : solicitacao.status === "aprovada" ? "bg-emerald-100 text-emerald-800 border-emerald-300"
    : "bg-rose-100 text-rose-800 border-rose-300";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            className="flex items-center gap-2 text-left"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <div>
              <div className="text-sm font-semibold text-foreground">
                {solicitacao.solicitante_nome ?? "—"}{" "}
                <span className="text-muted-foreground">•</span>{" "}
                Data: {fmtDate(solicitacao.data_credito)}
              </div>
              <div className="text-xs text-muted-foreground">
                Enviado em {fmtDT(solicitacao.criado_em)}
              </div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${statusColor}`}>
              {solicitacao.status}
            </span>
            {isAdmin && solicitacao.status === "pendente" && (
              <>
                <Button
                  size="sm"
                  className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => { setDecision("aprovar"); setMotivo(""); }}
                >
                  <Check className="h-4 w-4" /> Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 border-rose-300 text-rose-700 hover:bg-rose-50"
                  onClick={() => { setDecision("rejeitar"); setMotivo(""); }}
                >
                  <X className="h-4 w-4" /> Rejeitar
                </Button>
              </>
            )}
          </div>
        </div>

        {open && (
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <Field label="Empresa" value={String(p.empresa ?? "—")} />
            <Field label="Banco" value={String(p.banco ?? "—")} />
            <Field label="Descrição" value={String(p.descricao_pagamento ?? "—")} />
            <Field label="Valor LG" value={p.valor_lg != null ? brl(p.valor_lg) : "—"} />
            <Field label="Célula" value={String(p.celula ?? "—")} />
            <Field label="Competência" value={String(p.competencia ?? "—")} />
            <Field label="Folha" value={String(p.folha ?? "—")} />
            <Field label="Qtd. colaboradores" value={String(p.qtde_colaboradores ?? "—")} />
            <div className="md:col-span-2">
              <Field label="Justificativa do solicitante" value={solicitacao.motivo || "—"} />
            </div>
            {solicitacao.status !== "pendente" && (
              <>
                <Field label="Decidido por" value={solicitacao.decidido_por_nome ?? "—"} />
                <Field label="Decidido em" value={solicitacao.decidido_em ? fmtDT(solicitacao.decidido_em) : "—"} />
                <div className="md:col-span-2">
                  <Field label="Motivo da decisão" value={solicitacao.motivo_decisao || "—"} />
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={!!decision} onOpenChange={(o) => { if (!o) { setDecision(null); setMotivo(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === "aprovar" ? "Aprovar solicitação" : "Rejeitar solicitação"}
            </DialogTitle>
            <DialogDescription>
              {decision === "aprovar"
                ? "O pagamento será criado automaticamente na data solicitada."
                : "A solicitação ficará marcada como rejeitada."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo-dec">Observação (opcional)</Label>
            <Textarea
              id="motivo-dec"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: exceção autorizada por..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDecision(null); setMotivo(""); }}>Cancelar</Button>
            <Button
              onClick={() => decideMut.mutate()}
              disabled={decideMut.isPending}
              className={decision === "aprovar" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-rose-600 text-white hover:bg-rose-700"}
            >
              {decideMut.isPending ? "Salvando..." : decision === "aprovar" ? "Aprovar" : "Rejeitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}
