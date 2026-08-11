import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { AppLogo } from "@/components/app-logo";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Loader2, Plus, Trash2, Wallet, Filter, LayoutDashboard, Table2,
  Building2, CalendarClock, CheckCircle2, Clock, TrendingUp, Search, X
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { parseMoney, formatBRL } from "@/lib/money";
import { supabase } from "@/integrations/supabase/client";
import {
  listDespesasFixas, upsertDespesaFixa, deleteDespesaFixa, updateDescricaoMeta,
  CATEGORIAS_DESPESAS, GRUPOS_DESPESAS, grupoDeCategoria, EMPRESAS,
  type CategoriaDespesa, type GrupoDespesa, type DespesaFixa,
} from "@/lib/despesas-fixas.functions";

export const Route = createFileRoute("/despesas-fixas")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { returnTo: "/despesas-fixas" } });
    }
  },
  component: DespesasFixasPage,
});

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const brl = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

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
  ordem: number;
  registros: (DespesaFixa | null)[]; // 12
  totalPrevisto: number;
  totalLancado: number;
  meta: {
    empresa_codigo: string | null;
    empresa_nome: string | null;
    conta: string | null;
    centro_custo: string | null;
    numero_pedido: string | null;
    sap_code: string | null;
    pedido_antigo: string | null;
    pedido_novo: string | null;
    valor_previsto_anual: number | null;
    saldo_inicial_pedido: number | null;
    nome_real: string | null;
    notas: string | null;
    suspensa: boolean;
    motivo_suspensao: string | null;
    pedidos_vinculados?: string[]; // Para lançamentos múltiplos
  };
};

function DespesasFixasPage() {
  const [ano, setAno] = useState<number>(2026);
  const [tab, setTab] = useState<"dashboard" | GrupoDespesa>("dashboard");
  const [busca, setBusca] = useState("");
  const [showSuspended, setShowSuspended] = useState(false);
  const [showClosedMonths, setShowClosedMonths] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [novoQty, setNovoQty] = useState(1);
  const [novoOpen, setNovoOpen] = useState(false);
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
          ordem: (r as any).ordem ?? 0,
          registros: Array.from({ length: 12 }, () => null),
          totalPrevisto: 0,
          totalLancado: 0,
          meta: {
            empresa_codigo: r.empresa_codigo,
            empresa_nome: r.empresa_nome,
            conta: r.conta,
            centro_custo: r.centro_custo,
            numero_pedido: r.numero_pedido,
            sap_code: (r as any).sap_code ?? null,
            pedido_antigo: (r as any).pedido_antigo ?? null,
            pedido_novo: (r as any).pedido_novo ?? null,
            valor_previsto_anual: (r as any).valor_previsto_anual ?? null,
            saldo_inicial_pedido: (r as any).saldo_inicial_pedido ?? null,
            nome_real: (r as any).nome_real ?? null,
            notas: (r as any).notas ?? null,
            suspensa: !!(r as any).suspensa,
            motivo_suspensao: (r as any).motivo_suspensao ?? null,
          },
        };
        map.set(key, l);
      }
      l.registros[r.mes - 1] = r;
      const v = Number(r.valor) || 0;
      l.totalPrevisto += v;
      if (r.lancado) l.totalLancado += v;
      (["empresa_codigo","empresa_nome","conta","centro_custo","numero_pedido","sap_code","pedido_antigo","pedido_novo","valor_previsto_anual","saldo_inicial_pedido","nome_real","notas","suspensa","motivo_suspensao"] as const).forEach((k) => {
        if (!l!.meta[k as keyof typeof l.meta] && (r as any)[k]) (l!.meta as any)[k] = (r as any)[k];
      });
    });
    return Array.from(map.values()).sort(
      (a, b) => a.categoria.localeCompare(b.categoria) || a.ordem - b.ordem || a.descricao.localeCompare(b.descricao),
    );
  }, [data]);

  const linhasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const lins = showSuspended ? linhas : linhas.filter(l => !l.meta.suspensa);
    if (!q) return lins;
    return lins.filter((l) =>
      l.descricao.toLowerCase().includes(q) ||
      (l.meta.empresa_nome ?? "").toLowerCase().includes(q) ||
      (l.meta.empresa_codigo ?? "").includes(q) ||
      (l.meta.numero_pedido ?? "").includes(q) ||
      (l.meta.sap_code ?? "").includes(q)
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
    const qty = Math.min(50, Math.max(1, novoQty));
    for (let i = 0; i < qty; i++) {
      await upsertMut.mutateAsync({
        categoria: novaLinha.categoria, 
        descricao: qty > 1 ? `${novaLinha.descricao.trim()} (${i + 1})` : novaLinha.descricao.trim(),
        ano, mes: 1, valor: 0, lancado: false,
      });
    }
    toast.success(`${qty} linha(s) adicionada(s) — clique em uma célula para lançar.`);
    setNovaLinha(null);
    setNovoOpen(false);
  };

  const excluirLinhaCompleta = async (linha: LinhaAgrupada) => {
    const ids = linha.registros.filter(Boolean).map((r) => r!.id);
    for (const id of ids) await deleteFn({ data: { id } });
    qc.invalidateQueries({ queryKey });
    setConfirmDel(null);
    toast.success("Linha excluída");
  };

  const excluirEmLote = async () => {
    if (selectedKeys.size === 0) return;
    const lins = linhas.filter(l => selectedKeys.has(l.key));
    for (const linha of lins) {
      const ids = linha.registros.filter(Boolean).map((r) => r!.id);
      for (const id of ids) await deleteFn({ data: { id } });
    }
    qc.invalidateQueries({ queryKey });
    setSelectedKeys(new Set());
    toast.success(`${selectedKeys.size} linhas excluídas`);
  };

  const suspenderEmLote = async (motivo: string) => {
    if (selectedKeys.size === 0) return;
    const lins = linhas.filter(l => selectedKeys.has(l.key));
    for (const l of lins) {
      await updateMetaMut.mutateAsync({
        categoria: l.categoria, descricao: l.descricao, ano,
        suspensa: true, motivo_suspensao: motivo
      });
    }
    setSelectedKeys(new Set());
    toast.success(`${selectedKeys.size} linhas suspensas`);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-muted via-background to-emerald-50/40">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur">
            <SidebarTrigger />
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <AppLogo area="header" className="h-6 w-auto shrink-0 sm:h-7" />
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-sm font-semibold text-foreground">Despesas Fixas</h1>
                <Badge variant="secondary">Ano {ano}</Badge>
              </div>
            </Link>
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
              <div className="flex items-center gap-2 rounded-md border px-3 text-xs bg-card h-10">
                <Checkbox id="suspended" checked={showSuspended} onCheckedChange={(v) => setShowSuspended(!!v)} />
                <Label htmlFor="suspended" className="cursor-pointer">Ver suspensos</Label>
              </div>
              <div className="flex items-center gap-2 rounded-md border px-3 text-xs bg-card h-10">
                <Checkbox id="closedMonths" checked={showClosedMonths} onCheckedChange={(v) => setShowClosedMonths(!!v)} />
                <Label htmlFor="closedMonths" className="cursor-pointer">Ver meses fechados</Label>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Busca centralizada disponível em breve.")}>
                <Search className="h-4 w-4" /> Busca Centralizada
              </Button>
              {selectedKeys.size > 0 && (
                <div className="flex items-center gap-2 border-l pl-3 ml-2">
                  <span className="text-xs font-semibold text-indigo-600">{selectedKeys.size} selecionados</span>
                  <Button variant="destructive" size="sm" onClick={excluirEmLote} className="h-8 px-2">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const m = prompt("Motivo da suspensão em lote:");
                    if (m) suspenderEmLote(m);
                  }} className="h-8 px-2">
                    Suspender
                  </Button>
                </div>
              )}
              {tab !== "dashboard" && (
                <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="ml-auto bg-indigo-600 hover:bg-indigo-700 shadow-md">
                      <Plus className="mr-1 h-4 w-4" /> Nova linha
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Adicionar novas linhas</DialogTitle>
                      <DialogDescription>
                        Selecione a quantidade de linhas que deseja adicionar (limite de 50 por vez).
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label>Quantidade</Label>
                        <Input 
                          type="number" 
                          min={1} 
                          max={50} 
                          value={novoQty} 
                          onChange={(e) => setNovoQty(Math.min(50, Math.max(1, Number(e.target.value) || 1)))} 
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNovoOpen(false)}>Cancelar</Button>
                      <Button onClick={() => {
                        setNovaLinha({
                          categoria: tab === "PJ" ? "PJ" : tab === "Fornecedores" ? "Fornecedores" : "Pensão",
                          descricao: "",
                        });
                      }}>
                        Prosseguir
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                  className="w-80 border-emerald-300"
                  onKeyDown={(e) => { if (e.key === "Enter") criarNovaLinha(); if (e.key === "Escape") setNovaLinha(null); }} />
                <Button size="sm" onClick={criarNovaLinha} disabled={upsertMut.isPending} className="bg-emerald-600 hover:bg-emerald-700">Adicionar</Button>
                <Button size="sm" variant="ghost" onClick={() => setNovaLinha(null)} className="text-emerald-700">Cancelar</Button>
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
                      <div className="rounded-lg border border-border bg-card p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Valor mensal</div>
                        <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">{brl(dashboard.previstoMensal)}</div>
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
                            <Badge variant="outline" className="bg-card/90">#{g.quantidade}</Badge>
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
                      <div className="mb-2 text-sm font-semibold text-foreground">Evolução mensal</div>
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
                              <td className="px-2 py-2 text-xs font-semibold text-muted-foreground">Previsto</td>
                              {dashboard.porMes.map((m, i) => (
                                <td key={i} className="px-2 py-2 text-right tabular-nums">{brl(m.previsto)}</td>
                              ))}
                              <td className="px-2 py-2 text-right font-semibold tabular-nums">{brl(dashboard.previsto)}</td>
                            </tr>
                            <tr className="bg-emerald-50/60">
                              <td className="px-2 py-2 text-xs font-semibold text-emerald-700">Realizado</td>
                              {dashboard.porMes.map((m, i) => (
                                <td key={i} className="px-2 py-2 text-right tabular-nums text-emerald-700">{brl(m.lancado)}</td>
                              ))}
                              <td className="px-2 py-2 text-right font-semibold tabular-nums text-emerald-700">{brl(dashboard.lancado)}</td>
                            </tr>
                            <tr className="bg-muted/50">
                              <td className="px-2 py-2 text-xs font-semibold text-muted-foreground">Saldo</td>
                              {dashboard.porMes.map((m, i) => (
                                <td key={i} className="px-2 py-2 text-right tabular-nums">{brl(m.previsto - m.lancado)}</td>
                              ))}
                              <td className="px-2 py-2 text-right font-semibold tabular-nums">{brl(dashboard.previsto - dashboard.lancado)}</td>
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
                        showClosedMonths={showClosedMonths}
                        selectedKeys={selectedKeys}
                        onToggleSelect={(key, e) => {
                          const newSelected = new Set(selectedKeys);
                          if (e.ctrlKey || e.metaKey) {
                            if (newSelected.has(key)) newSelected.delete(key); else newSelected.add(key);
                          } else {
                            newSelected.clear();
                            newSelected.add(key);
                          }
                          setSelectedKeys(newSelected);
                        }}
                        onToggleAll={(keys) => {
                          if (keys.every(k => selectedKeys.has(k))) {
                            const next = new Set(selectedKeys);
                            keys.forEach(k => next.delete(k));
                            setSelectedKeys(next);
                          } else {
                            setSelectedKeys(new Set([...selectedKeys, ...keys]));
                          }
                        }}
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

function StatCard({ title, value, icon, tone, isCount }: { title: string; value: number; icon: React.ReactNode; tone: "slate" | "emerald" | "amber"; isCount?: boolean }) {
  const toneMap = {
    slate: "bg-card border-border text-foreground",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
  } as const;
  return (
    <div className={`rounded-lg border p-4 ${toneMap[tone]}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
        {icon} {title}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{isCount ? `#${value}` : brl(value)}</div>
    </div>
  );
}

function GrupoTabela({
  linhas, showClosedMonths, selectedKeys, onToggleSelect, onToggleAll, onOpenCelula, onOpenDescricao, onExcluir,
}: {
  linhas: LinhaAgrupada[];
  showClosedMonths: boolean;
  selectedKeys: Set<string>;
  onToggleSelect: (key: string, e: React.MouseEvent) => void;
  onToggleAll: (keys: string[]) => void;
  onOpenCelula: (l: LinhaAgrupada, mes: number) => void;
  onOpenDescricao: (l: LinhaAgrupada) => void;
  onExcluir: (l: LinhaAgrupada) => void;
}) {
  const currentMonthIdx = new Date().getMonth(); // 0-11
  const visibleMonths = useMemo(() => {
    if (showClosedMonths) return MESES;
    return MESES.filter((_, i) => i >= currentMonthIdx - 1);
  }, [showClosedMonths, currentMonthIdx]);

  const allSelected = linhas.length > 0 && linhas.every(l => selectedKeys.has(l.key));
  const someSelected = !allSelected && linhas.some(l => selectedKeys.has(l.key));

  const handleToggleAll = () => onToggleAll(linhas.map(l => l.key));

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
        <thead className="sticky top-0 bg-muted">
          <tr>
            <th className="w-8 border-b border-border px-2 py-2">
              <Checkbox checked={allSelected ? true : someSelected ? "indeterminate" : false} onCheckedChange={handleToggleAll} />
            </th>
            <th className="border-b border-border px-3 py-2 text-left font-semibold">Descrição / Empresa / Pedido</th>
            {MESES.map((m, i) => (
              visibleMonths.includes(m) && <th key={m} className="border-b border-border px-2 py-2 text-right font-semibold">{m}</th>
            ))}
            <th className="border-b border-border px-3 py-2 text-right font-semibold">Orçado/Saldo</th>
            <th className="border-b border-border px-3 py-2 text-right font-semibold">Previsto/Realizado</th>
            <th className="border-b border-border px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr 
              key={l.key} 
              className={cn(
                "hover:bg-muted/50 cursor-pointer", 
                l.meta.suspensa && "opacity-50 grayscale bg-muted/50",
                selectedKeys.has(l.key) && "bg-blue-50"
              )}
              onClick={(e) => onToggleSelect(l.key, e)}
            >
              <td className="border-b border-border px-2 py-1">
                <Checkbox checked={selectedKeys.has(l.key)} onCheckedChange={() => {}} onClick={(e) => e.stopPropagation()} />
              </td>
              <td className="border-b border-border px-3 py-2">
                <button
                  className="group flex flex-col items-start text-left"
                  onClick={() => onOpenDescricao(l)}
                  title="Clique para editar empresa, conta, centro de custo, pedido…"
                >
                  <span className="font-medium text-foreground underline-offset-2 group-hover:underline">
                    {l.descricao}
                    {l.meta.nome_real && l.meta.nome_real !== l.descricao ? (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">— {l.meta.nome_real}</span>
                    ) : null}
                    {l.meta.numero_pedido ? (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Pedido {l.meta.numero_pedido}
                      </span>
                    ) : null}
                    {l.meta.sap_code ? (
                      <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                        SAP {l.meta.sap_code}
                      </span>
                    ) : null}
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
                visibleMonths.includes(MESES[i]) && (
                  <td key={i} className="border-b border-border px-1 py-1 text-right">
                    <CelulaMes registro={r} onClick={() => onOpenCelula(l, i + 1)} />
                  </td>
                )
              ))}
              <td className="border-b border-border px-3 py-2 text-right tabular-nums">
                <div className="flex flex-col items-end">
                  <span className="font-semibold text-foreground">{brl(l.meta.valor_previsto_anual || 0)}</span>
                  <div className="flex items-center gap-1">
                    <Progress value={Math.min(100, (l.totalLancado / (l.meta.valor_previsto_anual || 1)) * 100)} className="h-1 w-12" />
                    <span className={cn(
                      "text-[10px] font-medium",
                      l.totalLancado > (l.meta.valor_previsto_anual || 0) ? "text-rose-600" : "text-muted-foreground"
                    )}>
                      Saldo {brl((l.meta.valor_previsto_anual || 0) - l.totalLancado)}
                    </span>
                  </div>
                </div>
              </td>
              <td className="border-b border-border px-3 py-2 text-right tabular-nums">
                <div className="flex flex-col items-end">
                  <span className="font-semibold text-foreground">{brl(l.totalPrevisto)}</span>
                  <span className={cn(
                    "text-[10px] font-medium",
                    l.totalLancado > 0 ? "text-emerald-700" : "text-muted-foreground"
                  )}>{brl(l.totalLancado)}</span>
                </div>
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
          ? "text-muted-foreground hover:bg-muted"
          : "text-muted-foreground hover:bg-muted")
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
  
  // Suporte a múltiplos lançamentos (NF com vários pedidos)
  const [entries, setEntries] = useState<any[]>(
    existente ? [{ ...existente, valor: String(existente.valor).replace(".", ",") }] : [{ valor: "", numero_pedido: linha.meta.numero_pedido ?? "" }]
  );

  const [tipo, setTipo] = useState<"mensal" | "adiantamento" | "antecipação" | "ppr">((existente?.tipo as any) ?? "mensal");
  const [numeroNf, setNumeroNf] = useState(existente?.numero_nf ?? "");
  const [dataLanc, setDataLanc] = useState(existente?.data_lancamento ?? format(new Date(), "yyyy-MM-dd"));
  const [dataVenc, setDataVenc] = useState(existente?.data_vencimento ?? "");
  const [dataEmissao, setDataEmissao] = useState((existente as any)?.data_emissao ?? "");
  const [competencia, setCompetencia] = useState((existente as any)?.competencia ?? (mes > 1 ? MESES[mes - 2] : MESES[11]));
  const [lancado, setLancado] = useState(!!existente?.lancado);
  const [saving, setSaving] = useState(false);

  const addEntry = () => setEntries([...entries, { valor: "", numero_pedido: linha.meta.numero_pedido ?? "" }]);
  const removeEntry = (i: number) => setEntries(entries.filter((_, idx) => idx !== i));
  const updateEntry = (i: number, field: string, val: string) => {
    const next = [...entries];
    next[i] = { ...next[i], [field]: val };
    setEntries(next);
  };

  const total = entries.reduce((acc, curr) => {
    const v = parseMoney(curr.valor);
    return acc + (v ?? 0);
  }, 0);

  const submit = async () => {
    if (entries.some((e) => parseMoney(e.valor) == null)) {
      toast.error("Informe um valor válido para todos os itens");
      return;
    }
    
    setSaving(true);
    try {
      const first = entries[0];
      const v = parseMoney(first.valor) ?? 0;
      
      await onSave({
        id: existente?.id,
        categoria: linha.categoria, descricao: linha.descricao, ano, mes,
        valor: v, tipo,
        numero_pedido: first.numero_pedido || null,
        numero_nf: numeroNf || null,
        data_lancamento: dataLanc || null,
        data_vencimento: dataVenc || null,
        data_emissao: dataEmissao || null,
        competencia: competencia || null,
        lancado,
        meta: entries.length > 1 ? { entries } : null
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Falha ao salvar lançamento");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{linha.descricao} — {MESES[mes - 1]}/{ano}</DialogTitle>
          <DialogDescription>{linha.categoria} · {linha.meta.empresa_nome ?? "sem empresa"}</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
              <Checkbox id="lancado" checked={lancado} onCheckedChange={(v) => setLancado(!!v)} />
              <Label htmlFor="lancado" className="cursor-pointer text-sm font-medium">
                Já foi lançado no sistema
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de Gasto</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="adiantamento">Adiantamento</SelectItem>
                    <SelectItem value="antecipação">Antecipação</SelectItem>
                    <SelectItem value="ppr">PPR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Competência</Label>
                <Select value={competencia} onValueChange={setCompetencia}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MESES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Nº da Nota Fiscal</Label>
                <Input value={numeroNf} onChange={(e) => setNumeroNf(e.target.value)} placeholder="000.000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px]">Emissão NF</Label>
                  <div className="relative">
                    <Input 
                      type="date" 
                      value={dataEmissao} 
                      onChange={(e) => setDataEmissao(e.target.value)} 
                      className="h-8 text-xs pr-8" 
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono pointer-events-none">
                      {dataEmissao ? dataEmissao.split('-').reverse().join('/') : ''}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-[11px]">Vencimento</Label>
                  <div className="relative">
                    <Input 
                      type="date" 
                      value={dataVenc} 
                      onChange={(e) => setDataVenc(e.target.value)} 
                      className="h-8 text-xs pr-8" 
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono pointer-events-none">
                      {dataVenc ? dataVenc.split('-').reverse().join('/') : ''}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-[11px]">Data de Lançamento (Pagamento)</Label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={dataLanc} 
                    onChange={(e) => setDataLanc(e.target.value)} 
                    className="h-8 text-xs pr-8" 
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono pointer-events-none">
                    {dataLanc ? dataLanc.split('-').reverse().join('/') : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-4 border-l pl-6">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold">Itens / Rateio</Label>
              <Button variant="ghost" size="sm" onClick={addEntry} className="h-7 text-indigo-600">
                <Plus className="mr-1 h-3 w-3" /> Add Item
              </Button>
            </div>

            <div className="max-h-[300px] space-y-3 overflow-y-auto pr-2">
              {entries.map((entry, i) => (
                <div key={i} className="relative space-y-2 rounded-lg border p-3 pt-4">
                  {entries.length > 1 && (
                    <button 
                      onClick={() => removeEntry(i)}
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground">Pedido</Label>
                      <Input 
                        value={entry.numero_pedido} 
                        onChange={(e) => updateEntry(i, 'numero_pedido', e.target.value)} 
                        placeholder="123..."
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground">Valor</Label>
                      <Input 
                        value={entry.valor} 
                        onChange={(e) => updateEntry(i, 'valor', e.target.value)} 
                        placeholder="0,00"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto rounded-md bg-indigo-50 p-3">
              <div className="flex items-center justify-between text-indigo-900">
                <span className="text-xs font-medium uppercase">Total Consolidado</span>
                <span className="text-lg font-bold">{brl(total)}</span>
              </div>
              {linha.meta.valor_previsto_anual && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-indigo-600">
                    <span>Orçamento Mensal</span>
                    <span>{brl(linha.meta.valor_previsto_anual / 12)}</span>
                  </div>
                  <Progress value={Math.min(100, (total / (linha.meta.valor_previsto_anual / 12)) * 100)} className="h-1 bg-indigo-200" />
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          {existente ? (
            <Button variant="ghost" className="text-destructive hover:bg-rose-50"
              onClick={() => onDelete(existente.id)}>
              <Trash2 className="mr-2 h-4 w-4" /> Remover
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={submit} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {existente ? "Atualizar" : "Confirmar Lançamento"}
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
  const [meta, setMeta] = useState(linha.meta);
  const [descricao, setDescricao] = useState(linha.descricao);
  const [nomeReal, setNomeReal] = useState(meta.nome_real ?? "");
  const [empresaCodigo, setEmpresaCodigo] = useState(meta.empresa_codigo ?? "");
  const [conta, setConta] = useState(meta.conta ?? "");
  const [centroCusto, setCentroCusto] = useState(meta.centro_custo ?? "");
  const [numeroPedido, setNumeroPedido] = useState(meta.numero_pedido ?? "");
  const [sapCode, setSapCode] = useState(meta.sap_code ?? "");
  const [valorPrevistoAnual, setValorPrevistoAnual] = useState(meta.valor_previsto_anual ?? 0);
  const [saldoInicialPedido, setSaldoInicialPedido] = useState(meta.saldo_inicial_pedido ?? 0);
  const [suspensa, setSuspensa] = useState(meta.suspensa);
  const [motivoSuspensao, setMotivoSuspensao] = useState(meta.motivo_suspensao ?? "");
  const [notas, setNotas] = useState(meta.notas ?? "");
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
        pedido_antigo: meta.pedido_antigo || null,
        pedido_novo: meta.pedido_novo || null,
        sap_code: sapCode || null,
        valor_previsto_anual: valorPrevistoAnual || null,
        saldo_inicial_pedido: saldoInicialPedido || null,
        nome_real: nomeReal || null,
        suspensa,
        motivo_suspensao: suspensa ? motivoSuspensao || null : null,
        notas: notas || null,
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Falha ao atualizar informações");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Descrição de despesa</DialogTitle>
          <DialogDescription>
            Categoria <strong>{linha.categoria}</strong> · valores aplicados a todos os meses de {ano}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Label>Descrição / Nomenclatura</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div>
            <Label>SAP Code</Label>
            <Input value={sapCode} onChange={(e) => setSapCode(e.target.value)} placeholder="ex.: 12345" />
          </div>
          <div>
            <Label>Nº pedido Antigo</Label>
            <Input value={meta.pedido_antigo || ""} onChange={(e) => setMeta({ ...meta, pedido_antigo: e.target.value })}
              placeholder="Antigo" />
          </div>
          <div>
            <Label>Nº pedido Novo</Label>
            <Input value={meta.pedido_novo || ""} onChange={(e) => setMeta({ ...meta, pedido_novo: e.target.value })}
              placeholder="Novo" />
          </div>
          <div>
            <Label>Nº do pedido (Atual)</Label>
            <Input value={numeroPedido} onChange={(e) => setNumeroPedido(e.target.value)}
              placeholder="ex.: 78910" />
          </div>
          <div>
            <Label>Orçamento Anual</Label>
            <Input type="number" value={valorPrevistoAnual} onChange={(e) => setValorPrevistoAnual(Number(e.target.value))} placeholder="0.00" />
          </div>
          <div>
            <Label>Saldo Inicial Pedido</Label>
            <Input type="number" value={saldoInicialPedido} onChange={(e) => setSaldoInicialPedido(Number(e.target.value))} placeholder="0.00" />
          </div>
          <div className="col-span-3 border-t pt-2 mt-2">
            <Label className="text-indigo-700 font-bold mb-2 block">Informações de Pagamento (Fase 1.6.0+)</Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Empresa</Label>
                <Select value={empresaCodigo} onValueChange={setEmpresaCodigo}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {EMPRESAS.map(e => <SelectItem key={e.codigo} value={e.codigo}>{e.codigo} - {e.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Centro de Custo</Label>
                <Input value={centroCusto} onChange={(e) => setCentroCusto(e.target.value)} placeholder="0000" />
              </div>
              <div>
                <Label>Conta Contábil</Label>
                <Input value={conta} onChange={(e) => setConta(e.target.value)} placeholder="0.0.0.0" />
              </div>
            </div>
          </div>
          {linha.categoria === "PJ" && (
            <div className="col-span-3">
              <Label>Nome real do PJ</Label>
              <Input value={nomeReal} onChange={(e) => setNomeReal(e.target.value)}
                placeholder="ex.: João da Silva Consultoria LTDA" />
            </div>
          )}
          <div className="col-span-3">
            <Label>Notas / Observações Internas</Label>
            <Textarea 
              value={notas} 
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotas(e.target.value)} 
              placeholder="Detalhes adicionais sobre esta despesa..." 
              className="h-20" 
            />
          </div>
          <div className="col-span-3 space-y-3 rounded-md border border-red-100 bg-red-50/50 p-3">
            <div className="flex items-center gap-2">
              <Checkbox id="suspensa-meta" checked={suspensa} onCheckedChange={(v) => setSuspensa(!!v)} />
              <Label htmlFor="suspensa-meta" className="cursor-pointer font-semibold text-red-800">Suspender registro</Label>
            </div>
            {suspensa && (
              <div className="space-y-1">
                <Label className="text-xs text-red-700">Motivo da suspensão (Obrigatório)</Label>
                <Input value={motivoSuspensao} onChange={(e) => setMotivoSuspensao(e.target.value)} placeholder="Descreva o motivo..." className="border-red-200" />
              </div>
            )}
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

