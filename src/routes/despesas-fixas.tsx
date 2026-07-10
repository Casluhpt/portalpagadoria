import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2, Plus, Trash2, Wallet, Filter, LayoutDashboard, Table2,
  Building2, CalendarClock, CheckCircle2, Clock, TrendingUp,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import {
  listDespesasFixas, upsertDespesaFixa, deleteDespesaFixa, updateDescricaoMeta,
  CATEGORIAS_DESPESAS, GRUPOS_DESPESAS, grupoDeCategoria, EMPRESAS,
  type CategoriaDespesa, type GrupoDespesa, type DespesaFixa,
} from "@/lib/despesas-fixas.functions";

export const Route = createFileRoute("/despesas-fixas")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: DespesasFixasPage,
});

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const chipGrupo: Record<GrupoDespesa, string> = {
  "PJ": "bg-blue-100 text-blue-800 border-blue-200",
  "Penhora e Pensão": "bg-amber-100 text-amber-800 border-amber-200",
  "Fornecedores": "bg-emerald-100 text-emerald-800 border-emerald-200",
};

type LinhaAgrupada = {
  key: string;
  categoria: CategoriaDespesa;
  grupo: GrupoDespesa;
  descricao: string;
  registros: (DespesaFixa | null)[]; // 12
  totalPrevisto: number;
  totalLancado: number;
  meta: {
    empresa_codigo: string | null;
    empresa_nome: string | null;
    conta: string | null;
    centro_custo: string | null;
    numero_pedido: string | null;
    nome_real: string | null;
    notas: string | null;
  };
};

function DespesasFixasPage() {
  const [ano, setAno] = useState<number>(2026);
  const [tab, setTab] = useState<"dashboard" | GrupoDespesa>("dashboard");
  const [busca, setBusca] = useState("");
  const [novaLinha, setNovaLinha] = useState<{ categoria: CategoriaDespesa; descricao: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<LinhaAgrupada | null>(null);
  const [editandoRegistro, setEditandoRegistro] = useState<{
    linha: LinhaAgrupada; mes: number;
  } | null>(null);
  const [editandoDescricao, setEditandoDescricao] = useState<LinhaAgrupada | null>(null);

  const listFn = useServerFn(listDespesasFixas);
  const upsertFn = useServerFn(upsertDespesaFixa);
  const deleteFn = useServerFn(deleteDespesaFixa);
  const updateMetaFn = useServerFn(updateDescricaoMeta);
  const qc = useQueryClient();

  const queryKey = ["despesas-fixas", ano] as const;
  const { data = [], isLoading, error } = useQuery({
    queryKey, queryFn: () => listFn({ data: { ano } }), staleTime: 30_000,
  });

  const upsertMut = useMutation({
    mutationFn: (input: any) => upsertFn({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (e: any) => toast.error(e?.message ?? "Falha ao salvar"),
  });
  const updateMetaMut = useMutation({
    mutationFn: (input: any) => updateMetaFn({ data: input }),
    onSuccess: () => { qc.invalidateQueries({ queryKey }); toast.success("Informações atualizadas"); },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao atualizar"),
  });

  const linhas: LinhaAgrupada[] = useMemo(() => {
    const map = new Map<string, LinhaAgrupada>();
    data.forEach((r) => {
      const key = `${r.categoria}||${r.descricao}`;
      let l = map.get(key);
      if (!l) {
        l = {
          key,
          categoria: r.categoria,
          grupo: grupoDeCategoria(r.categoria),
          descricao: r.descricao,
          registros: Array.from({ length: 12 }, () => null),
          totalPrevisto: 0,
          totalLancado: 0,
          meta: {
            empresa_codigo: r.empresa_codigo,
            empresa_nome: r.empresa_nome,
            conta: r.conta,
            centro_custo: r.centro_custo,
            numero_pedido: r.numero_pedido,
            nome_real: (r as any).nome_real ?? null,
            notas: (r as any).notas ?? null,
          },
        };
        map.set(key, l);
      }
      l!.registros[r.mes - 1] = r;
      const v = Number(r.valor) || 0;
      l!.totalPrevisto += v;
      if (r.lancado) l!.totalLancado += v;
      // meta: prefer non-null
      (["empresa_codigo","empresa_nome","conta","centro_custo","numero_pedido","nome_real","notas"] as const).forEach((k) => {
        if (!l!.meta[k] && (r as any)[k]) l!.meta[k] = (r as any)[k];
      });
    });
    return Array.from(map.values()).sort(
      (a, b) => a.categoria.localeCompare(b.categoria) || a.descricao.localeCompare(b.descricao),
    );
  }, [data]);

  const linhasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return linhas;
    return linhas.filter((l) =>
      l.descricao.toLowerCase().includes(q) ||
      (l.meta.empresa_nome ?? "").toLowerCase().includes(q) ||
      (l.meta.empresa_codigo ?? "").includes(q),
    );
  }, [linhas, busca]);

  const linhasPorGrupo = (g: GrupoDespesa) => linhasFiltradas.filter((l) => l.grupo === g);

  const totaisGrupo = (g: GrupoDespesa) => {
    const arr = linhasPorGrupo(g);
    let previsto = 0, lancado = 0;
    let previstoMensal = 0, lancadoMensal = 0;
    let previstoAdto = 0, lancadoAdto = 0;
    arr.forEach((l) =>
      l.registros.forEach((r) => {
        if (!r) return;
        const v = Number(r.valor) || 0;
        const isAdto = r.tipo === "adiantamento";
        previsto += v;
        if (isAdto) previstoAdto += v; else previstoMensal += v;
        if (r.lancado) {
          lancado += v;
          if (isAdto) lancadoAdto += v; else lancadoMensal += v;
        }
      }),
    );
    return {
      previsto, lancado, pendente: previsto - lancado, quantidade: arr.length,
      previstoMensal, lancadoMensal, previstoAdto, lancadoAdto,
    };
  };

  const dashboard = useMemo(() => {
    const grupos = GRUPOS_DESPESAS.map((g) => ({ grupo: g, ...totaisGrupo(g) }));
    const previsto = grupos.reduce((a, g) => a + g.previsto, 0);
    const lancado = grupos.reduce((a, g) => a + g.lancado, 0);
    const previstoMensal = grupos.reduce((a, g) => a + g.previstoMensal, 0);
    const previstoAdto = grupos.reduce((a, g) => a + g.previstoAdto, 0);
    const lancadoMensal = grupos.reduce((a, g) => a + g.lancadoMensal, 0);
    const lancadoAdto = grupos.reduce((a, g) => a + g.lancadoAdto, 0);
    const totalPessoas = linhasFiltradas.length;
    const porMes = Array.from({ length: 12 }, () => ({ previsto: 0, lancado: 0 }));
    linhasFiltradas.forEach((l) =>
      l.registros.forEach((r, i) => {
        if (!r) return;
        const v = Number(r.valor) || 0;
        porMes[i].previsto += v;
        if (r.lancado) porMes[i].lancado += v;
      }),
    );
    return {
      grupos, previsto, lancado, pendente: previsto - lancado, porMes,
      previstoMensal, previstoAdto, lancadoMensal, lancadoAdto, totalPessoas,
    };
  }, [linhasFiltradas]);

  const criarNovaLinha = async () => {
    if (!novaLinha) return;
    if (!novaLinha.descricao.trim()) { toast.error("Informe uma descrição"); return; }
    await upsertMut.mutateAsync({
      categoria: novaLinha.categoria, descricao: novaLinha.descricao.trim(),
      ano, mes: 1, valor: 0, lancado: false,
    });
    toast.success("Linha adicionada — clique em uma célula para lançar.");
    setNovaLinha(null);
  };

  const excluirLinhaCompleta = async (linha: LinhaAgrupada) => {
    const ids = linha.registros.filter(Boolean).map((r) => r!.id);
    for (const id of ids) await deleteFn({ data: { id } });
    qc.invalidateQueries({ queryKey });
    setConfirmDel(null);
    toast.success("Linha excluída");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50/40">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-700" />
              <h1 className="text-sm font-semibold text-slate-800">Despesas Fixas</h1>
              <Badge variant="secondary">Ano {ano}</Badge>
            </div>
            <div className="ml-auto"><HeaderActions /></div>
          </header>

          <main className="flex-1 space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                placeholder="Buscar por descrição, empresa ou código…"
                value={busca} onChange={(e) => setBusca(e.target.value)} className="w-80"
              />
              {tab !== "dashboard" && (
                <Button size="sm" className="ml-auto"
                  onClick={() => setNovaLinha({
                    categoria: tab === "PJ" ? "PJ" : tab === "Fornecedores" ? "Fornecedores" : "Pensão",
                    descricao: "",
                  })}>
                  <Plus className="mr-1 h-4 w-4" /> Nova linha
                </Button>
              )}
            </div>

            {novaLinha && (
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-3">
                <Select value={novaLinha.categoria}
                  onValueChange={(v) => setNovaLinha({ ...novaLinha, categoria: v as CategoriaDespesa })}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_DESPESAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input autoFocus placeholder="Descrição (ex.: João da Silva)"
                  value={novaLinha.descricao}
                  onChange={(e) => setNovaLinha({ ...novaLinha, descricao: e.target.value })}
                  className="w-80"
                  onKeyDown={(e) => { if (e.key === "Enter") criarNovaLinha(); if (e.key === "Escape") setNovaLinha(null); }} />
                <Button size="sm" onClick={criarNovaLinha} disabled={upsertMut.isPending}>Adicionar</Button>
                <Button size="sm" variant="ghost" onClick={() => setNovaLinha(null)}>Cancelar</Button>
              </div>
            )}

            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList>
                <TabsTrigger value="dashboard"><LayoutDashboard className="mr-1 h-4 w-4" /> Dashboard</TabsTrigger>
                {GRUPOS_DESPESAS.map((g) => (
                  <TabsTrigger key={g} value={g}><Table2 className="mr-1 h-4 w-4" /> {g}</TabsTrigger>
                ))}
              </TabsList>

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                  {(error as any)?.message ?? "Falha ao carregar."}
                </div>
              ) : (
                <>
                  <TabsContent value="dashboard" className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <StatCard title={`# Pessoas / Itens`} value={dashboard.totalPessoas} icon={<Building2 className="h-4 w-4" />} tone="slate" isCount />
                      <StatCard title="Saldo total previsto" value={dashboard.previsto} icon={<TrendingUp className="h-4 w-4" />} tone="slate" />
                      <StatCard title="Total lançado" value={dashboard.lancado} icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" />
                      <StatCard title="Pendente de lançar" value={dashboard.pendente} icon={<Clock className="h-4 w-4" />} tone="amber" />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Valor mensal</div>
                        <div className="mt-1 text-2xl font-bold tabular-nums text-slate-800">{brl(dashboard.previstoMensal)}</div>
                        <div className="mt-1 text-xs text-emerald-700">Lançado: <span className="font-semibold">{brl(dashboard.lancadoMensal)}</span></div>
                      </div>
                      {dashboard.previstoAdto > 0 && (
                        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Adiantamento (adto)</div>
                          <div className="mt-1 text-2xl font-bold tabular-nums text-indigo-900">{brl(dashboard.previstoAdto)}</div>
                          <div className="mt-1 text-xs text-emerald-700">Lançado: <span className="font-semibold">{brl(dashboard.lancadoAdto)}</span></div>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      {dashboard.grupos.map((g) => (
                        <div key={g.grupo} className={`rounded-lg border p-4 ${chipGrupo[g.grupo]}`}>
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{g.grupo}</div>
                            <Badge variant="outline" className="bg-white/60">#{g.quantidade}</Badge>
                          </div>
                          <div className="mt-2 text-2xl font-bold">{brl(g.previsto)}</div>
                          <div className="mt-2 space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span>Mensal</span><span className="font-semibold">{brl(g.previstoMensal)}</span>
                            </div>
                            {g.previstoAdto > 0 && (
                              <div className="flex items-center justify-between">
                                <span>Adto</span><span className="font-semibold">{brl(g.previstoAdto)}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span>Lançado</span><span className="font-semibold">{brl(g.lancado)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Pendente</span><span className="font-semibold">{brl(g.pendente)}</span>
                            </div>
                            <Progress value={g.previsto ? (g.lancado / g.previsto) * 100 : 0} className="mt-2 h-1.5" />
                          </div>
                        </div>
                      ))}
                    </div>


                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="mb-2 text-sm font-semibold text-slate-700">Evolução mensal</div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-sm">
                          <thead>
                            <tr className="text-xs text-muted-foreground">
                              <th className="px-2 py-1 text-left">Mês</th>
                              {MESES.map((m) => <th key={m} className="px-2 py-1 text-right">{m}</th>)}
                              <th className="px-2 py-1 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="px-2 py-2 text-xs font-semibold text-slate-600">Previsto</td>
                              {dashboard.porMes.map((m, i) => (
                                <td key={i} className="px-2 py-2 text-right tabular-nums">{brl(m.previsto)}</td>
                              ))}
                              <td className="px-2 py-2 text-right font-semibold tabular-nums">{brl(dashboard.previsto)}</td>
                            </tr>
                            <tr className="bg-emerald-50/60">
                              <td className="px-2 py-2 text-xs font-semibold text-emerald-700">Lançado</td>
                              {dashboard.porMes.map((m, i) => (
                                <td key={i} className="px-2 py-2 text-right tabular-nums text-emerald-700">{brl(m.lancado)}</td>
                              ))}
                              <td className="px-2 py-2 text-right font-semibold tabular-nums text-emerald-700">{brl(dashboard.lancado)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>

                  {GRUPOS_DESPESAS.map((g) => (
                    <TabsContent key={g} value={g} className="space-y-2">
                      <GrupoTabela
                        linhas={linhasPorGrupo(g)}
                        onOpenCelula={(linha, mes) => setEditandoRegistro({ linha, mes })}
                        onOpenDescricao={(linha) => setEditandoDescricao(linha)}
                        onExcluir={(linha) => setConfirmDel(linha)}
                      />
                    </TabsContent>
                  ))}
                </>
              )}
            </Tabs>
          </main>
        </div>
      </div>

      {editandoRegistro && (
        <RegistroDialog
          key={`${editandoRegistro.linha.key}-${editandoRegistro.mes}`}
          linha={editandoRegistro.linha}
          mes={editandoRegistro.mes}
          ano={ano}
          onClose={() => setEditandoRegistro(null)}
          onSave={async (payload) => {
            await upsertMut.mutateAsync(payload);
            setEditandoRegistro(null);
            toast.success("Lançamento salvo");
          }}
          onDelete={async (id) => {
            await deleteFn({ data: { id } });
            qc.invalidateQueries({ queryKey });
            setEditandoRegistro(null);
            toast.success("Lançamento removido");
          }}
        />
      )}

      {editandoDescricao && (
        <DescricaoDialog
          key={editandoDescricao.key}
          linha={editandoDescricao}
          ano={ano}
          onClose={() => setEditandoDescricao(null)}
          onSave={async (payload) => {
            await updateMetaMut.mutateAsync(payload);
            setEditandoDescricao(null);
          }}
        />
      )}

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir linha?</AlertDialogTitle>
            <AlertDialogDescription>
              A linha <strong>{confirmDel?.descricao}</strong> ({confirmDel?.categoria}) e todos os
              seus lançamentos serão apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (confirmDel) excluirLinhaCompleta(confirmDel); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}

function StatCard({ title, value, icon, tone }: { title: string; value: number; icon: React.ReactNode; tone: "slate" | "emerald" | "amber" }) {
  const toneMap = {
    slate: "bg-white border-slate-200 text-slate-800",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
  } as const;
  return (
    <div className={`rounded-lg border p-4 ${toneMap[tone]}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
        {icon} {title}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{brl(value)}</div>
    </div>
  );
}

function GrupoTabela({
  linhas, onOpenCelula, onOpenDescricao, onExcluir,
}: {
  linhas: LinhaAgrupada[];
  onOpenCelula: (l: LinhaAgrupada, mes: number) => void;
  onOpenDescricao: (l: LinhaAgrupada) => void;
  onExcluir: (l: LinhaAgrupada) => void;
}) {
  if (linhas.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        Nenhuma linha neste grupo. Clique em <strong>Nova linha</strong> para adicionar.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[1200px] border-collapse text-sm">
        <thead className="sticky top-0 bg-slate-50">
          <tr>
            <th className="border-b border-border px-3 py-2 text-left font-semibold">Descrição / Empresa</th>
            {MESES.map((m) => (
              <th key={m} className="border-b border-border px-2 py-2 text-right font-semibold">{m}</th>
            ))}
            <th className="border-b border-border px-3 py-2 text-right font-semibold">Previsto</th>
            <th className="border-b border-border px-3 py-2 text-right font-semibold">Lançado</th>
            <th className="border-b border-border px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.key} className="hover:bg-slate-50/60">
              <td className="border-b border-border px-3 py-2">
                <button
                  className="group flex flex-col items-start text-left"
                  onClick={() => onOpenDescricao(l)}
                  title="Clique para editar empresa, conta, centro de custo, pedido…"
                >
                  <span className="font-medium text-slate-800 underline-offset-2 group-hover:underline">
                    {l.descricao}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {l.meta.empresa_codigo || l.meta.empresa_nome
                      ? `${l.meta.empresa_codigo ?? ""} ${l.meta.empresa_nome ?? ""}`.trim()
                      : "Definir empresa…"}
                    {l.meta.centro_custo ? ` · CC ${l.meta.centro_custo}` : ""}
                  </span>
                </button>
              </td>
              {l.registros.map((r, i) => (
                <td key={i} className="border-b border-border px-1 py-1 text-right">
                  <CelulaMes registro={r} onClick={() => onOpenCelula(l, i + 1)} />
                </td>
              ))}
              <td className="border-b border-border px-3 py-2 text-right font-semibold text-slate-700 tabular-nums">
                {brl(l.totalPrevisto)}
              </td>
              <td className="border-b border-border px-3 py-2 text-right font-semibold text-emerald-700 tabular-nums">
                {brl(l.totalLancado)}
              </td>
              <td className="border-b border-border px-2 py-1 text-right">
                <Button size="icon" variant="ghost" onClick={() => onExcluir(l)} aria-label="Excluir linha">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CelulaMes({ registro, onClick }: { registro: DespesaFixa | null; onClick: () => void }) {
  const valor = Number(registro?.valor ?? 0);
  const lancado = !!registro?.lancado;
  return (
    <button
      onClick={onClick}
      className={
        "inline-block w-24 rounded px-2 py-1 text-right text-xs tabular-nums transition-colors " +
        (lancado
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
          : valor
          ? "text-slate-600 hover:bg-slate-100"
          : "text-slate-300 hover:bg-slate-100")
      }
      title={lancado ? "Lançado" : valor ? "Previsto (não lançado)" : "Sem valor"}
    >
      {valor ? brl(valor) : "—"}
    </button>
  );
}

function RegistroDialog({
  linha, mes, ano, onClose, onSave, onDelete,
}: {
  linha: LinhaAgrupada; mes: number; ano: number;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const existente = linha.registros[mes - 1];
  const [valor, setValor] = useState<string>(
    existente?.valor ? String(existente.valor).replace(".", ",") : "",
  );
  const [tipo, setTipo] = useState<"mensal" | "adiantamento">((existente?.tipo as any) ?? "mensal");
  const [numeroPedido, setNumeroPedido] = useState(existente?.numero_pedido ?? linha.meta.numero_pedido ?? "");
  const [numeroNf, setNumeroNf] = useState(existente?.numero_nf ?? "");
  const [dataLanc, setDataLanc] = useState(existente?.data_lancamento ?? "");
  const [dataVenc, setDataVenc] = useState(existente?.data_vencimento ?? "");
  const [lancado, setLancado] = useState(!!existente?.lancado);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const v = parseFloat(valor.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(v)) { toast.error("Valor inválido"); return; }
    setSaving(true);
    try {
      await onSave({
        id: existente?.id,
        categoria: linha.categoria, descricao: linha.descricao, ano, mes,
        valor: v, tipo,
        numero_pedido: numeroPedido || null,
        numero_nf: numeroNf || null,
        data_lancamento: dataLanc || null,
        data_vencimento: dataVenc || null,
        lancado,
      });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{linha.descricao} — {MESES[mes - 1]}/{ano}</DialogTitle>
          <DialogDescription>{linha.categoria} · {linha.meta.empresa_nome ?? "sem empresa"}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex items-center gap-2 rounded-md border p-2">
            <Checkbox id="lancado" checked={lancado} onCheckedChange={(v) => setLancado(!!v)} />
            <Label htmlFor="lancado" className="cursor-pointer text-sm">
              Já foi lançado (entra no saldo lançado)
            </Label>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="adiantamento">Adiantamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valor</Label>
            <Input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="0,00" />
          </div>
          <div>
            <Label>Nº do pedido</Label>
            <Input value={numeroPedido} onChange={(e) => setNumeroPedido(e.target.value)} placeholder="ex.: 12345" />
          </div>
          <div>
            <Label>Nº da NF fiscal</Label>
            <Input value={numeroNf} onChange={(e) => setNumeroNf(e.target.value)} placeholder="ex.: 000123" />
          </div>
          <div>
            <Label><CalendarClock className="mr-1 inline h-3 w-3" /> Data de lançamento</Label>
            <Input type="date" value={dataLanc} onChange={(e) => setDataLanc(e.target.value)} />
          </div>
          <div>
            <Label><CalendarClock className="mr-1 inline h-3 w-3" /> Data de vencimento</Label>
            <Input type="date" value={dataVenc} onChange={(e) => setDataVenc(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          {existente ? (
            <Button variant="ghost" className="text-destructive"
              onClick={() => onDelete(existente.id)}>
              <Trash2 className="mr-1 h-4 w-4" /> Remover lançamento
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={submit} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DescricaoDialog({
  linha, ano, onClose, onSave,
}: {
  linha: LinhaAgrupada; ano: number;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}) {
  const [descricao, setDescricao] = useState(linha.descricao);
  const [empresaCodigo, setEmpresaCodigo] = useState(linha.meta.empresa_codigo ?? "");
  const [conta, setConta] = useState(linha.meta.conta ?? "");
  const [centroCusto, setCentroCusto] = useState(linha.meta.centro_custo ?? "");
  const [numeroPedido, setNumeroPedido] = useState(linha.meta.numero_pedido ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const empresa = EMPRESAS.find((e) => e.codigo === empresaCodigo);
    setSaving(true);
    try {
      await onSave({
        categoria: linha.categoria, descricao: linha.descricao, ano,
        nova_descricao: descricao.trim() || linha.descricao,
        empresa_codigo: empresa?.codigo ?? null,
        empresa_nome: empresa?.nome ?? null,
        conta: conta || null,
        centro_custo: centroCusto || null,
        numero_pedido: numeroPedido || null,
      });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Informações da linha</DialogTitle>
          <DialogDescription>
            Categoria <strong>{linha.categoria}</strong> · valores aplicados a todos os meses de {ano}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Descrição</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Empresa</Label>
            <Select value={empresaCodigo || "__none__"} onValueChange={(v) => setEmpresaCodigo(v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— sem empresa —</SelectItem>
                {EMPRESAS.map((e) => (
                  <SelectItem key={e.codigo} value={e.codigo}>{e.codigo} — {e.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Conta</Label>
            <Input value={conta} onChange={(e) => setConta(e.target.value)} placeholder="ex.: 4.01.001" />
          </div>
          <div>
            <Label>Centro de custo</Label>
            <Input value={centroCusto} onChange={(e) => setCentroCusto(e.target.value)} placeholder="ex.: ADM" />
          </div>
          <div className="col-span-2">
            <Label>Pedido padrão</Label>
            <Input value={numeroPedido} onChange={(e) => setNumeroPedido(e.target.value)}
              placeholder="ex.: 78910 (usado como sugestão nos lançamentos)" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
