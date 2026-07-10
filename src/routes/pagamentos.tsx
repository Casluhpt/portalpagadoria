import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import {
  Loader2, Plus, Search, Trash2, ArrowUpDown, ArrowUp, ArrowDown,
  Upload, Download, LayoutGrid, Table as TableIcon,
} from "lucide-react";
import {
  BarChart, Bar, LineChart as ReLineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";

import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import { useSession } from "@/hooks/use-session";
import {
  createPagamento, createPagamentosBulk, deletePagamento,
  fetchPagamentos, pagamentosQueryKey, updatePagamento,
  type PagamentoInput,
} from "@/lib/pagamentos";
import {
  PAGAMENTO_CAMPOS, COMPETENCIAS, getDescricoesByCelula,
} from "@/lib/pagamentos-constants";

const HIDDEN_COLUMN_KEYS = new Set([
  "valor_bankmanager","status_bankmanager","diferenca_lg_finnet",
  "valor_itau","status_itau","diferenca_bank_itau","natureza_pagamento",
]);
const VISIBLE_CAMPOS = PAGAMENTO_CAMPOS.filter((c) => !HIDDEN_COLUMN_KEYS.has(c.key));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _dummy = () => {
  type Pagamento,
} from "@/lib/pagamentos-constants";

export const Route = createFileRoute("/pagamentos")({
  component: PagamentosPage,
});

const brl = (n: number | null | undefined) =>
  n == null ? "" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const brlShort = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("pt-BR");
}

function PagamentosPage() {
  const { user } = useSession();
  const colaboradorNome =
    (user?.user_metadata?.nome as string) ||
    (user?.user_metadata?.full_name as string) ||
    user?.email ||
    "Anônimo";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold text-foreground">Pagamentos Diversos</h1>
            <div className="ml-auto">
              <HeaderActions />
            </div>
          </header>
          <Tabs defaultValue="lancamentos" className="flex flex-1 flex-col">
            <div className="border-b border-border bg-background px-4">
              <TabsList className="h-11 bg-transparent">
                <TabsTrigger value="lancamentos" className="gap-2">
                  <TableIcon className="h-4 w-4" /> Lançamentos
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="gap-2">
                  <LayoutGrid className="h-4 w-4" /> Dashboard
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="lancamentos" className="flex-1 p-0 data-[state=inactive]:hidden">
              <LancamentosTab colaboradorNome={colaboradorNome} userId={user?.id ?? null} />
            </TabsContent>
            <TabsContent value="dashboard" className="flex-1 p-0 data-[state=inactive]:hidden">
              <DashboardTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SidebarProvider>
  );
}

/* ---------------- LANÇAMENTOS ---------------- */

function LancamentosTab({ colaboradorNome, userId }: { colaboradorNome: string; userId: string | null }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data = [], isLoading } = useQuery({
    queryKey: pagamentosQueryKey,
    queryFn: fetchPagamentos,
    staleTime: 30_000,
  });

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof Pagamento>("registrado_em");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [pendingDelete, setPendingDelete] = useState<Pagamento | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: pagamentosQueryKey });

  const createMut = useMutation({
    mutationFn: () => createPagamento({}, colaboradorNome, userId),
    onSuccess: () => { invalidate(); toast.success("Novo lançamento adicionado"); },
    onError: (e: Error) => toast.error("Falha ao inserir: " + e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: PagamentoInput }) => updatePagamento(id, patch),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error("Falha ao salvar: " + e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePagamento(id),
    onSuccess: () => { invalidate(); toast.success("Registro excluído"); },
    onError: (e: Error) => toast.error("Falha ao excluir: " + e.message),
  });

  const importMut = useMutation({
    mutationFn: (rows: PagamentoInput[]) => createPagamentosBulk(rows, colaboradorNome, userId),
    onSuccess: (n) => { invalidate(); toast.success(`${n} lançamento(s) importado(s)`); },
    onError: (e: Error) => toast.error("Falha na importação: " + e.message),
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? data.filter((r) =>
          PAGAMENTO_CAMPOS.some((c) => {
            const v = r[c.key];
            return v != null && String(v).toLowerCase().includes(q);
          }),
        )
      : data;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv), "pt-BR");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, search, sortKey, sortDir]);

  const toggleSort = (k: keyof Pagamento) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  };

  const handleExport = () => {
    const exportRows = rows.map((r) => {
      const o: Record<string, unknown> = {};
      for (const c of PAGAMENTO_CAMPOS) {
        const v = r[c.key];
        o[c.label] = c.key === "registrado_em" ? fmtDateTime(v as string) : v;
      }
      return o;
    });
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pagamentos");
    XLSX.writeFile(wb, `pagamentos-diversos-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleFile = async (f: File) => {
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: true });

      // Normalize: strip accents, lowercase, collapse spaces, unify ×→x
      const norm = (s: string) =>
        s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
         .replace(/×/g, "x").toLowerCase().replace(/\s+/g, " ").trim();

      // Prefer the data sheet "PGTOS Diversos"; fallback to the largest sheet
      const dataSheetName =
        wb.SheetNames.find((n) => norm(n).includes("pgtos")) ??
        wb.SheetNames.reduce((best, n) => {
          const rows = XLSX.utils.decode_range(wb.Sheets[n]["!ref"] ?? "A1").e.r;
          const bestRows = XLSX.utils.decode_range(wb.Sheets[best]["!ref"] ?? "A1").e.r;
          return rows > bestRows ? n : best;
        }, wb.SheetNames[0]);
      const ws = wb.Sheets[dataSheetName];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
      const parsed: PagamentoInput[] = [];
      const errors: string[] = [];

      // Aliases (arquivo → app) — matched by normalized header
      const aliases: Record<string, string> = {
        "celula": "célula",
        "ev. saida folha mensal": "ev. saída folha",
        "ev saida folha mensal": "ev. saída folha",
        "data de credito": "data de crédito",
        "qtde colaboradores no arquivo": "qtde colab.",
        "diferenca lg x finnet": "dif. lg x finnet",
        "diferença lg x finnet": "dif. lg x finnet",
        "status concluido itau": "status itaú",
        "status concluído itau": "status itaú",
        "status concluído itaú": "status itaú",
        "diferenca bankmananger x itau": "dif. bank x itaú",
        "diferença bankmananger x  itau": "dif. bank x itaú",
        "diferença bankmanager x itau": "dif. bank x itaú",
        "natureza do pagamento": "natureza",
      };

      // map normalized label → column
      const labelMap = new Map<string, typeof PAGAMENTO_CAMPOS[number]>();
      for (const c of PAGAMENTO_CAMPOS) {
        if (c.editable === false) continue;
        labelMap.set(norm(c.label), c);
      }

      raw.forEach((row, i) => {
        const rec: Record<string, unknown> = {};
        for (const [rawKey, rawVal] of Object.entries(row)) {
          const key = String(rawKey);
          // skip xlsx auto-generated headers for blank columns (e.g. "__EMPTY")
          if (key.startsWith("__EMPTY")) continue;
          const n = norm(key);
          const targetLabel = aliases[n] ?? n;
          const col = labelMap.get(targetLabel);
          if (!col) continue;
          if (rawVal === null || rawVal === "") continue;
          if (col.kind === "number" || col.kind === "currency") {
            const num = Number(String(rawVal).replace(/[R$\s.]/g, "").replace(",", "."));
            if (Number.isNaN(num)) { errors.push(`Linha ${i+2}: ${col.label} inválido`); continue; }
            rec[col.key] = num;
          } else if (col.kind === "date") {
            const d = rawVal instanceof Date ? rawVal : new Date(String(rawVal));
            if (isNaN(d.getTime())) { errors.push(`Linha ${i+2}: ${col.label} data inválida`); continue; }
            rec[col.key] = d.toISOString().slice(0,10);
          } else {
            rec[col.key] = String(rawVal).trim();
          }
        }
        if (Object.keys(rec).length > 0) parsed.push(rec as PagamentoInput);
      });

      if (errors.length) toast.warning(`${errors.length} aviso(s) na importação. ${errors.slice(0,3).join("; ")}${errors.length>3?"…":""}`);
      if (!parsed.length) { toast.error(`Nenhum registro válido encontrado na aba "${dataSheetName}"`); return; }
      toast.info(`Lendo aba "${dataSheetName}" — ${parsed.length} linha(s)…`);
      importMut.mutate(parsed);
    } catch (e) {
      toast.error("Erro ao ler o arquivo: " + (e as Error).message);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="sticky top-14 z-[5] flex flex-wrap items-center gap-2 border-b border-border bg-background/80 px-4 py-2 backdrop-blur">
        <div className="text-xs text-muted-foreground">
          {isLoading ? "Carregando…" : `${rows.length.toLocaleString("pt-BR")} lançamento(s)`}
        </div>
        <div className="relative ml-2 w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <Button size="sm" variant="outline" className="gap-1" onClick={() => fileRef.current?.click()} disabled={importMut.isPending}>
            {importMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importar Excel
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={handleExport} disabled={!rows.length}>
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
          <Button size="sm" className="gap-1" onClick={() => createMut.mutate()} disabled={createMut.isPending}>
            <Plus className="h-4 w-4" /> Novo
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="relative max-h-[calc(100vh-11rem)] overflow-auto rounded-lg border border-border bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="min-w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                <tr>
                  <th className="w-10 border-b border-border px-2 py-2 text-left font-semibold text-muted-foreground">#</th>
                  {PAGAMENTO_CAMPOS.map((c) => (
                    <th
                      key={c.key}
                      className="cursor-pointer select-none whitespace-nowrap border-b border-r border-border px-2 py-2 text-left font-semibold text-foreground hover:bg-muted"
                      onClick={() => toggleSort(c.key)}
                    >
                      <div className="flex items-center gap-1">
                        {c.label}
                        {sortKey === c.key
                          ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)
                          : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </div>
                    </th>
                  ))}
                  <th className="sticky right-0 z-10 w-10 border-b border-border bg-muted/95 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className="group hover:bg-muted/40">
                    <td className="border-b border-border px-2 py-1 text-muted-foreground">{i + 1}</td>
                    {PAGAMENTO_CAMPOS.map((c) => (
                      <EditableCell
                        key={c.key}
                        row={r}
                        col={c}
                        onSave={(patch) => updateMut.mutate({ id: r.id, patch })}
                      />
                    ))}
                    <td className="sticky right-0 z-0 border-b border-border bg-card px-1 py-1 group-hover:bg-muted/40">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setPendingDelete(r)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={PAGAMENTO_CAMPOS.length + 2} className="px-4 py-16 text-center text-sm text-muted-foreground">
                      Nenhum lançamento. Clique em "Novo" ou importe uma planilha Excel.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação é permanente e ficará registrada na auditoria.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pendingDelete) deleteMut.mutate(pendingDelete.id); setPendingDelete(null); }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditableCell({
  row, col, onSave,
}: {
  row: Pagamento;
  col: typeof PAGAMENTO_CAMPOS[number];
  onSave: (patch: PagamentoInput) => void;
}) {
  const raw = row[col.key];
  const editable = col.editable !== false && !col.computed;

  const display = (() => {
    if (raw == null || raw === "") return "";
    if (col.key === "registrado_em") return fmtDateTime(raw as string);
    if (col.kind === "currency") return brl(raw as number);
    return String(raw);
  })();

  const [editing, setEditing] = useState(false);
  const initial = raw == null ? "" : String(raw);
  const [value, setValue] = useState(initial);

  const syncedStr = raw == null ? "" : String(raw);
  if (!editing && value !== syncedStr) setValue(syncedStr);

  const commit = () => {
    setEditing(false);
    if (value === syncedStr) return;
    let parsed: string | number | null;
    if (value === "") parsed = null;
    else if (col.kind === "number" || col.kind === "currency") {
      const n = Number(value.replace(/[R$\s.]/g, "").replace(",", "."));
      if (Number.isNaN(n)) { setValue(syncedStr); return; }
      parsed = n;
    } else {
      parsed = value;
    }
    onSave({ [col.key]: parsed } as PagamentoInput);
  };

  const width =
    col.kind === "currency" ? 130 :
    col.kind === "date" ? 130 :
    col.kind === "number" ? 100 :
    col.key === "descricao_pagamento" ? 240 :
    col.key === "tipo_arquivo" || col.key === "arquivo_remessa" ? 200 :
    col.key === "observacao" ? 200 : 140;

  if (!editable) {
    return (
      <td style={{ minWidth: width }} className="whitespace-nowrap border-b border-r border-border px-2 py-1 text-muted-foreground">
        {display || <span className="opacity-40">—</span>}
      </td>
    );
  }

  if (col.kind === "select" && col.options) {
    const opts =
      col.key === "descricao_pagamento"
        ? getDescricoesByCelula(row.celula)
        : col.options;
    return (
      <td style={{ minWidth: width }} className="border-b border-r border-border p-0">
        <Select
          value={(raw as string) ?? ""}
          onValueChange={(v) => onSave({ [col.key]: v || null } as PagamentoInput)}
        >
          <SelectTrigger className="h-8 border-0 bg-transparent text-xs shadow-none focus:ring-1">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {opts.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </td>
    );
  }

  return (
    <td style={{ minWidth: width }} className="border-b border-r border-border p-0">
      {editing ? (
        <input
          autoFocus
          type={col.kind === "date" ? "date" : "text"}
          inputMode={col.kind === "number" || col.kind === "currency" ? "decimal" : undefined}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") { setValue(syncedStr); setEditing(false); }
          }}
          className="w-full bg-background px-2 py-1.5 text-xs outline-none ring-2 ring-primary/60"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="block w-full truncate px-2 py-1.5 text-left text-xs hover:bg-muted/40"
          title={display || "—"}
        >
          {display || <span className="text-muted-foreground/60">—</span>}
        </button>
      )}
    </td>
  );
}

/* ---------------- DASHBOARD ---------------- */

const PIE_COLORS = ["#3b82f6","#8b5cf6","#22c55e","#f59e0b","#ef4444","#06b6d4","#ec4899","#84cc16","#f97316","#14b8a6"];

function DashboardTab() {
  const { data = [], isLoading } = useQuery({
    queryKey: pagamentosQueryKey,
    queryFn: fetchPagamentos,
    staleTime: 30_000,
  });

  const [fEmpresa, setFEmpresa] = useState<string>("");
  const [fCelula, setFCelula] = useState<string>("");
  const [fCompetencia, setFCompetencia] = useState<string>("");
  
  const [fBanco, setFBanco] = useState<string>("");
  const [fFolha, setFFolha] = useState<string>("");
  const [fDataIni, setFDataIni] = useState<string>("");
  const [fDataFim, setFDataFim] = useState<string>("");
  const [fColab, setFColab] = useState<string>("");

  const opts = useMemo(() => {
    const uniq = (k: keyof Pagamento) =>
      Array.from(new Set(data.map((r) => r[k]).filter((v) => v != null && v !== ""))).sort() as string[];
    return {
      empresa: uniq("empresa"),
      celula: uniq("celula"),
      banco: uniq("banco"),
      folha: uniq("folha"),
      colab: uniq("colaborador_nome"),
      
    };
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((r) => {
      if (fEmpresa && r.empresa !== fEmpresa) return false;
      if (fCelula && r.celula !== fCelula) return false;
      if (fCompetencia && r.competencia !== fCompetencia) return false;
      
      if (fBanco && r.banco !== fBanco) return false;
      if (fFolha && r.folha !== fFolha) return false;
      if (fColab && r.colaborador_nome !== fColab) return false;
      if (fDataIni && (r.data_credito ?? "") < fDataIni) return false;
      if (fDataFim && (r.data_credito ?? "") > fDataFim) return false;
      return true;
    });
  }, [data, fEmpresa, fCelula, fCompetencia, fBanco, fFolha, fColab, fDataIni, fDataFim]);

  const kpis = useMemo(() => {
    const total = filtered.reduce((s, r) => s + (Number(r.valor_lg) || 0), 0);
    const qtdColab = filtered.reduce((s, r) => s + (Number(r.qtde_colaboradores) || 0), 0);
    const media = filtered.length ? total / filtered.length : 0;
    return {
      total, qtdColab, media,
      lancamentos: filtered.length,
      empresas: new Set(filtered.map((r) => r.empresa).filter(Boolean)).size,
      descricoes: new Set(filtered.map((r) => r.descricao_pagamento).filter(Boolean)).size,
    };
  }, [filtered]);

  const porEmpresa = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const k = r.empresa || "—";
      m.set(k, (m.get(k) ?? 0) + (Number(r.valor_lg) || 0));
    }
    return Array.from(m, ([empresa, valor]) => ({ empresa, valor })).sort((a,b) => b.valor - a.valor);
  }, [filtered]);

  const porCelula = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const k = r.celula || "—";
      m.set(k, (m.get(k) ?? 0) + (Number(r.valor_lg) || 0));
    }
    return Array.from(m, ([celula, valor]) => ({ celula, valor })).sort((a,b) => b.valor - a.valor);
  }, [filtered]);

  const porDescricao = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const k = r.descricao_pagamento || "—";
      m.set(k, (m.get(k) ?? 0) + (Number(r.valor_lg) || 0));
    }
    return Array.from(m, ([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 10);
  }, [filtered]);

  const evolucao = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      if (!r.data_credito) continue;
      m.set(r.data_credito, (m.get(r.data_credito) ?? 0) + (Number(r.valor_lg) || 0));
    }
    return Array.from(m, ([data, valor]) => ({ data, valor })).sort((a,b) => a.data.localeCompare(b.data));
  }, [filtered]);

  const topLancamentos = useMemo(
    () => [...filtered].sort((a,b) => (Number(b.valor_lg)||0) - (Number(a.valor_lg)||0)).slice(0, 10),
    [filtered]
  );

  const clearFilters = () => {
    setFEmpresa(""); setFCelula(""); setFCompetencia("");
    setFBanco(""); setFFolha(""); setFColab(""); setFDataIni(""); setFDataFim("");
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5">
            <FilterSelect label="Empresa" value={fEmpresa} onChange={setFEmpresa} options={opts.empresa} />
            <FilterSelect label="Célula" value={fCelula} onChange={setFCelula} options={opts.celula} />
            <FilterSelect label="Competência" value={fCompetencia} onChange={setFCompetencia} options={[...COMPETENCIAS]} />
            
            <FilterSelect label="Banco" value={fBanco} onChange={setFBanco} options={opts.banco} />
            <FilterSelect label="Folha" value={fFolha} onChange={setFFolha} options={opts.folha} />
            <FilterSelect label="Colaborador" value={fColab} onChange={setFColab} options={opts.colab} />
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Data inicial</label>
              <Input type="date" value={fDataIni} onChange={(e) => setFDataIni(e.target.value)} className="h-9" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Data final</label>
              <Input type="date" value={fDataFim} onChange={(e) => setFDataFim(e.target.value)} className="h-9" />
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">Limpar filtros</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Valor Total" value={brlShort(kpis.total)} />
        <Kpi label="Lançamentos" value={kpis.lancamentos.toLocaleString("pt-BR")} />
        <Kpi label="Colaboradores" value={kpis.qtdColab.toLocaleString("pt-BR")} />
        <Kpi label="Empresas" value={String(kpis.empresas)} />
        <Kpi label="Tipos de Pagamento" value={String(kpis.descricoes)} />
        <Kpi label="Média por Lançamento" value={brlShort(kpis.media)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total por Empresa</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porEmpresa.slice(0,10)}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="empresa" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => brlShort(v)} />
                <Tooltip formatter={(v: number) => brl(v)} />
                <Bar dataKey="valor" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total por Célula</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porCelula}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="celula" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => brlShort(v)} />
                <Tooltip formatter={(v: number) => brl(v)} />
                <Bar dataKey="valor" fill="#8b5cf6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição por Tipo de Pagamento (Top 10)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={porDescricao} dataKey="value" nameKey="name" outerRadius={90} label={(e: { name: string }) => e.name.slice(0, 18)}>
                  {porDescricao.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => brl(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Evolução dos Pagamentos</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => brlShort(v)} />
                <Tooltip formatter={(v: number) => brl(v)} />
                <Line type="monotone" dataKey="valor" stroke="#22c55e" strokeWidth={2} dot={false} />
              </ReLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Ranking — Maiores Lançamentos</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-2 py-1 text-left">#</th>
                  <th className="px-2 py-1 text-left">Empresa</th>
                  <th className="px-2 py-1 text-left">Descrição</th>
                  <th className="px-2 py-1 text-left">Data</th>
                  <th className="px-2 py-1 text-right">Valor LG</th>
                </tr>
              </thead>
              <tbody>
                {topLancamentos.map((r, i) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                    <td className="px-2 py-1">{r.empresa ?? "—"}</td>
                    <td className="px-2 py-1">{r.descricao_pagamento ?? "—"}</td>
                    <td className="px-2 py-1">{r.data_credito ?? "—"}</td>
                    <td className="px-2 py-1 text-right font-medium">{brl(r.valor_lg)}</td>
                  </tr>
                ))}
                {topLancamentos.length === 0 && (
                  <tr><td colSpan={5} className="px-2 py-6 text-center text-muted-foreground">Sem dados no filtro atual.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
        <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <Select value={value || "__all"} onValueChange={(v) => onChange(v === "__all" ? "" : v)}>
        <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all">Todos</SelectItem>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
