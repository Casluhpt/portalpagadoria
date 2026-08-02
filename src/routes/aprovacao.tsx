import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Copy, Download, Loader2, Plus, Scissors, Search, Trash2, Upload,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import {
  APROVACAO_STATUS, APROVACAO_TIPOS, type Aprovacao, type AprovacaoStatus, type AprovacaoTipo,
  bulkInsertAprovacoes, deleteAprovacoes, listAprovacoes, upsertAprovacao,
} from "@/lib/aprovacoes.functions";
import { EMPRESAS } from "@/lib/despesas-fixas.functions";

export const Route = createFileRoute("/aprovacao")({
  component: AprovacaoPage,
});

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const STATUS_CHIP: Record<AprovacaoStatus, string> = {
  Agendado: "bg-blue-100 text-blue-800 border-blue-200",
  Pago: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Recusado: "bg-red-100 text-red-800 border-red-200",
  Pendente: "bg-amber-100 text-amber-800 border-amber-200",
  Cancelado: "bg-slate-200 text-slate-700 border-slate-300",
};

const empresaNome = (codigo: string | null) => {
  if (!codigo) return "—";
  const e = EMPRESAS.find((x) => x.codigo === codigo);
  return e ? `${e.codigo} — ${e.nome}` : codigo;
};

function AprovacaoPage() {
  const [ano, setAno] = useState(2026);
  const [tab, setTab] = useState<"dashboard" | "base">("dashboard");

  const listFn = useServerFn(listAprovacoes);
  const upsertFn = useServerFn(upsertAprovacao);
  const bulkInsertFn = useServerFn(bulkInsertAprovacoes);
  const deleteFn = useServerFn(deleteAprovacoes);
  const qc = useQueryClient();
  const queryKey = ["aprovacoes", ano] as const;

  const { data = [], isLoading } = useQuery({
    queryKey, queryFn: () => listFn({ data: { ano } }), staleTime: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey });

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Processo de Aprovação</h1>
            <p className="text-xs text-muted-foreground">Evidências de agendamento bancário por empresa, tipo e status.</p>
          </div>
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </header>

        <div className="p-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="base">Base</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-4">
              <DashboardView rows={data} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="base" className="mt-4">
              <BaseView
                rows={data}
                ano={ano}
                isLoading={isLoading}
                onUpsert={async (r) => { await upsertFn({ data: r }); invalidate(); }}
                onBulkInsert={async (rows) => { const r = await bulkInsertFn({ data: { rows } }); invalidate(); return r; }}
                onDelete={async (ids) => { await deleteFn({ data: { ids } }); invalidate(); }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </SidebarProvider>
  );
}

/* ============================ DASHBOARD ============================ */

function DashboardView({ rows, isLoading }: { rows: Aprovacao[]; isLoading: boolean }) {
  const [drill, setDrill] = useState<{ titulo: string; itens: Aprovacao[] } | null>(null);

  const empresas = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.empresa ?? "—"));
    return Array.from(set).sort();
  }, [rows]);

  const total = rows.length;
  const valorTotal = rows.reduce((s, r) => s + Number(r.valor || 0), 0);

  const porStatus = (st: AprovacaoStatus) => rows.filter((r) => r.status === st);
  const porStatusTipo = (st: AprovacaoStatus, tipo: AprovacaoTipo) =>
    rows.filter((r) => r.status === st && r.tipo === tipo);
  const porEmpresaStatus = (empresa: string, st: AprovacaoStatus, tipo?: AprovacaoTipo) =>
    rows.filter((r) => (r.empresa ?? "—") === empresa && r.status === st && (!tipo || r.tipo === tipo));

  if (isLoading) {
    return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>;
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Nenhum registro. Vá para a aba <b>Base</b> para importar ou lançar.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cartões de topo */}
      <div className="grid gap-3 md:grid-cols-6">
        <StatCard label="# Registros" value={total} onClick={() => setDrill({ titulo: "Todos os registros", itens: rows })} />
        <StatCard label="Valor total" value={brl(valorTotal)} />
        {APROVACAO_STATUS.map((st) => (
          <StatCard
            key={st}
            label={st}
            value={porStatus(st).length}
            chip={STATUS_CHIP[st]}
            onClick={() => setDrill({ titulo: st, itens: porStatus(st) })}
          />
        ))}
      </div>

      {/* Mensal vs Adto */}
      <div className="grid gap-3 md:grid-cols-2">
        {APROVACAO_TIPOS.map((tipo) => {
          const arr = rows.filter((r) => r.tipo === tipo);
          const val = arr.reduce((s, r) => s + Number(r.valor || 0), 0);
          return (
            <Card key={tipo}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm capitalize">
                  Pagamento {tipo === "mensal" ? "Mensal" : "Adiantamento"} — # {arr.length} · {brl(val)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {APROVACAO_STATUS.map((st) => {
                    const items = porStatusTipo(st, tipo);
                    return (
                      <button
                        key={st}
                        onClick={() => setDrill({ titulo: `${st} · ${tipo}`, itens: items })}
                        className={`rounded-md border px-2 py-2 text-left transition hover:opacity-90 ${STATUS_CHIP[st]}`}
                      >
                        <div className="text-xs opacity-80">{st}</div>
                        <div className="text-lg font-semibold"># {items.length}</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Matriz Empresa × Status (clicável) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quantidade por empresa e status</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-3 py-2">Empresa</th>
                {APROVACAO_STATUS.map((st) => (
                  <th key={st} className="px-3 py-2 text-center">{st}</th>
                ))}
                <th className="px-3 py-2 text-center">Total</th>
                <th className="px-3 py-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((emp) => {
                const empRows = rows.filter((r) => (r.empresa ?? "—") === emp);
                const val = empRows.reduce((s, r) => s + Number(r.valor || 0), 0);
                return (
                  <tr key={emp} className="border-t">
                    <td className="px-3 py-2 font-medium">{empresaNome(emp === "—" ? null : emp)}</td>
                    {APROVACAO_STATUS.map((st) => {
                      const items = porEmpresaStatus(emp, st);
                      return (
                        <td key={st} className="px-3 py-2 text-center">
                          <button
                            className={`rounded-md border px-2 py-1 text-xs ${items.length ? STATUS_CHIP[st] : "text-muted-foreground"}`}
                            disabled={!items.length}
                            onClick={() => setDrill({ titulo: `${empresaNome(emp === "—" ? null : emp)} · ${st}`, itens: items })}
                          >
                            # {items.length}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center font-semibold">{empRows.length}</td>
                    <td className="px-3 py-2 text-right">{brl(val)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!drill} onOpenChange={(o) => !o && setDrill(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{drill?.titulo}</DialogTitle>
            <DialogDescription>{drill?.itens.length ?? 0} registro(s)</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/50">
                <tr className="text-left">
                  <th className="px-3 py-2">Empresa</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Ordem Pagto</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {drill?.itens.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{empresaNome(r.empresa)}</td>
                    <td className="px-3 py-2 capitalize">{r.tipo}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.ordem_pagamento ?? "—"}</td>
                    <td className="px-3 py-2 text-right">{brl(Number(r.valor || 0))}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className={STATUS_CHIP[r.status]}>{r.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, chip, onClick }: {
  label: string; value: number | string; chip?: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`rounded-lg border p-3 text-left transition ${onClick ? "hover:bg-muted/50" : ""} ${chip ?? ""}`}
    >
      <div className="text-xs opacity-80">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </button>
  );
}

/* ============================ BASE ============================ */

type BaseProps = {
  rows: Aprovacao[];
  ano: number;
  isLoading: boolean;
  onUpsert: (r: Partial<Aprovacao> & { ano: number }) => Promise<void>;
  onBulkInsert: (data: { rows: any[]; replaceAll?: boolean }) => Promise<{ inserted: number }>;
  onDelete: (ids: string[]) => Promise<void>;
};

const EMP_CODIGOS = EMPRESAS.map((e) => e.codigo);

function BaseView({ rows, ano, isLoading, onUpsert, onBulkInsert, onDelete }: BaseProps) {
  const [busca, setBusca] = useState("");
  const [importMode, setImportMode] = useState<"incremental" | "replace">("incremental");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDel, setConfirmDel] = useState(false);
  const [novoQtd, setNovoQtd] = useState(1);
  const [novoOpen, setNovoOpen] = useState(false);
  const [clipboard, setClipboard] = useState<Aprovacao[]>([]);
  const [cutIds, setCutIds] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (empresaNome(r.empresa).toLowerCase().includes(q)) ||
      (r.ordem_pagamento ?? "").toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q),
    );
  }, [rows, busca]);

  const allChecked = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };

  const selectedRows = rows.filter((r) => selected.has(r.id));

  const handleCopy = () => {
    if (!selectedRows.length) return toast.info("Nenhuma linha selecionada");
    setClipboard(selectedRows);
    setCutIds(new Set());
    toast.success(`${selectedRows.length} linha(s) copiada(s)`);
  };
  const handleCut = () => {
    if (!selectedRows.length) return toast.info("Nenhuma linha selecionada");
    setClipboard(selectedRows);
    setCutIds(new Set(selectedRows.map((r) => r.id)));
    toast.success(`${selectedRows.length} linha(s) recortada(s) — cole para mover`);
  };
  const handlePaste = async () => {
    if (!clipboard.length) return toast.info("Nada para colar");
    const maxOrdem = Math.max(0, ...rows.map((r) => r.ordem));
    const payload = clipboard.map((r, i) => ({
      empresa: r.empresa, tipo: r.tipo, ordem_pagamento: r.ordem_pagamento,
      valor: Number(r.valor), status: r.status, ano, ordem: maxOrdem + i + 1,
    }));
    await onBulkInsert({ rows: payload });
    if (cutIds.size) {
      await onDelete(Array.from(cutIds));
      setCutIds(new Set());
    }
    setSelected(new Set());
    toast.success(`${payload.length} linha(s) coladas`);
  };
  const handleDeleteSelected = async () => {
    if (!selectedRows.length) return;
    await onDelete(selectedRows.map((r) => r.id));
    setSelected(new Set());
    setConfirmDel(false);
    toast.success("Removido");
  };

  const handleNovo = async () => {
    const qtd = Math.max(1, Math.min(500, Number(novoQtd) || 1));
    const maxOrdem = Math.max(0, ...rows.map((r) => r.ordem));
    const payload = Array.from({ length: qtd }).map((_, i) => ({
      empresa: null, tipo: "mensal" as const, ordem_pagamento: null,
      valor: 0, status: "Pendente" as const, ano, ordem: maxOrdem + i + 1,
    }));
    await onBulkInsert({ rows: payload });
    setNovoOpen(false);
    toast.success(`${qtd} linha(s) adicionada(s)`);
  };

  const handleExport = () => {
    const wsData = [
      ["Empresa (código)", "Tipo", "Ordem Pagamento", "Valor", "Status"],
      ...rows.map((r) => [r.empresa ?? "", r.tipo, r.ordem_pagamento ?? "", Number(r.valor), r.status]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Aprovacoes");
    XLSX.writeFile(wb, `aprovacoes_${ano}.xlsx`);
  };

  const handleImport = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sh = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sh, { defval: "" });
      const maxOrdem = Math.max(0, ...rows.map((r) => r.ordem));
      const payload = raw.map((row, i) => {
        const get = (keys: string[]) => {
          for (const k of keys) {
            const found = Object.keys(row).find((rk) => rk.toLowerCase().replace(/[^a-z0-9]/g, "") === k.toLowerCase().replace(/[^a-z0-9]/g, ""));
            if (found && row[found] !== "" && row[found] != null) return row[found];
          }
          return null;
        };
        const empRaw = String(get(["Empresa", "empresa", "empresacodigo"]) ?? "").trim();
        const empresa: string | null = empRaw ? ((EMP_CODIGOS as readonly string[]).includes(empRaw) ? empRaw : empRaw.split(/[\s—-]/)[0]) : null;
        const tipoRaw = String(get(["Tipo", "tipo"]) ?? "mensal").toLowerCase().trim();
        const tipo: AprovacaoTipo = (tipoRaw.startsWith("adt") ? "adto" : "mensal");
        const stRaw = String(get(["Status", "status"]) ?? "Pendente").trim();
        const status = (APROVACAO_STATUS.find((s) => s.toLowerCase() === stRaw.toLowerCase()) ?? "Pendente") as AprovacaoStatus;
        const valor = Number(get(["Valor", "valor", "value"]) ?? 0) || 0;
        return {
          empresa, tipo,
          ordem_pagamento: (get(["OrdemPagamento", "ordem_pagamento", "OP", "ordem"]) as string | null) ? String(get(["OrdemPagamento", "ordem_pagamento", "OP", "ordem"])) : null,
          valor, status, ano, ordem: maxOrdem + i + 1,
        };
      }).filter((r) => r.empresa || r.ordem_pagamento || r.valor);
      if (!payload.length) return toast.error("Nenhuma linha válida encontrada");
      const res = await onBulkInsert({ rows: payload, replaceAll: importMode === "replace" });
      toast.success(`${res.inserted} linha(s) importada(s)`);
    } catch (e: any) {
      toast.error("Falha ao importar: " + (e?.message ?? e));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar empresa, OP, status…" className="pl-8 w-72" />
        </div>
        <Badge variant="secondary">{selected.size} selecionada(s)</Badge>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleCopy}><Copy className="h-4 w-4 mr-1" />Copiar</Button>
        <Button variant="outline" size="sm" onClick={handleCut}><Scissors className="h-4 w-4 mr-1" />Recortar</Button>
        <Button variant="outline" size="sm" onClick={handlePaste} disabled={!clipboard.length}>Colar ({clipboard.length})</Button>
        <Button variant="outline" size="sm" onClick={() => setConfirmDel(true)} disabled={!selected.size}><Trash2 className="h-4 w-4 mr-1" />Excluir</Button>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 mr-1" />Importar</Button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); }} />
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Exportar</Button>
        <Button size="sm" onClick={() => setNovoOpen(true)}><Plus className="h-4 w-4 mr-1" />Novo</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="w-10 px-2 py-2 text-center">#</th>
              <th className="w-10 px-2 py-2 text-center">
                <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
              </th>
              <th className="px-3 py-2 min-w-[220px]">Empresa</th>
              <th className="px-3 py-2 w-28">Tipo</th>
              <th className="px-3 py-2 min-w-[160px]">Ordem Pagamento</th>
              <th className="px-3 py-2 w-40 text-right">Valor</th>
              <th className="px-3 py-2 w-36">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="py-6 text-center text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Carregando…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Nenhum registro. Clique em <b>Novo</b> ou <b>Importar</b>.</td></tr>
            )}
            {filtered.map((r, i) => (
              <BaseRow
                key={r.id}
                index={i + 1}
                row={r}
                ano={ano}
                selected={selected.has(r.id)}
                onToggle={() => toggle(r.id)}
                onUpsert={onUpsert}
                dimmed={cutIds.has(r.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selected.size} linha(s)?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar novas linhas</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <Input type="number" min={1} max={500} value={novoQtd} onChange={(e) => setNovoQtd(Number(e.target.value))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoOpen(false)}>Cancelar</Button>
            <Button onClick={handleNovo}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BaseRow({ index, row, ano, selected, onToggle, onUpsert, dimmed }: {
  index: number;
  row: Aprovacao;
  ano: number;
  selected: boolean;
  onToggle: () => void;
  onUpsert: (r: Partial<Aprovacao> & { ano: number }) => Promise<void>;
  dimmed: boolean;
}) {
  const [local, setLocal] = useState<Aprovacao>(row);
  useMemoSync(row, setLocal);

  const patch = async (p: Partial<Aprovacao>) => {
    const next = { ...local, ...p };
    setLocal(next);
    await onUpsert({ id: next.id, empresa: next.empresa, tipo: next.tipo, ordem_pagamento: next.ordem_pagamento, valor: Number(next.valor || 0), status: next.status, ano, ordem: next.ordem });
  };

  return (
    <tr className={`border-t ${dimmed ? "opacity-50" : ""} ${selected ? "bg-primary/5" : ""}`}>
      <td className="px-2 py-1 text-center text-xs text-muted-foreground">{index}</td>
      <td className="px-2 py-1 text-center"><Checkbox checked={selected} onCheckedChange={onToggle} /></td>
      <td className="px-2 py-1">
        <Select value={local.empresa ?? ""} onValueChange={(v) => patch({ empresa: v || null })}>
          <SelectTrigger className="h-8"><SelectValue placeholder="Selecionar…" /></SelectTrigger>
          <SelectContent>
            {EMPRESAS.map((e) => (
              <SelectItem key={e.codigo} value={e.codigo}>{e.codigo} — {e.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-2 py-1">
        <Select value={local.tipo} onValueChange={(v) => patch({ tipo: v as AprovacaoTipo })}>
          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mensal">Mensal</SelectItem>
            <SelectItem value="adto">Adto</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-2 py-1">
        <Input
          className="h-8"
          value={local.ordem_pagamento ?? ""}
          onChange={(e) => setLocal({ ...local, ordem_pagamento: e.target.value })}
          onBlur={() => patch({ ordem_pagamento: local.ordem_pagamento || null })}
        />
      </td>
      <td className="px-2 py-1">
        <Input
          className="h-8 text-right"
          type="number" step="0.01"
          value={local.valor ?? 0}
          onChange={(e) => setLocal({ ...local, valor: Number(e.target.value) })}
          onBlur={() => patch({ valor: Number(local.valor || 0) })}
        />
      </td>
      <td className="px-2 py-1">
        <Select value={local.status} onValueChange={(v) => patch({ status: v as AprovacaoStatus })}>
          <SelectTrigger className={`h-8 ${STATUS_CHIP[local.status]}`}><SelectValue /></SelectTrigger>
          <SelectContent>
            {APROVACAO_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </td>
    </tr>
  );
}

/** Sync local state when a fresh server row arrives. */
function useMemoSync(row: Aprovacao, setLocal: (r: Aprovacao) => void) {
  const key = `${row.id}|${row.empresa}|${row.tipo}|${row.ordem_pagamento}|${row.valor}|${row.status}`;
  useMemo(() => { setLocal(row); }, [key]);
}
