import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Search, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Upload, Download, FileSpreadsheet } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { useSession } from "@/hooks/use-session";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  LANCAMENTO_COLUNAS,
  importLancamentosBulk,
  createLancamento,
  deleteLancamento,
  fetchAllLancamentos,
  lancamentosQueryKey,
  updateLancamento,
  type Lancamento,
} from "@/lib/lancamentos";

export const Route = createFileRoute("/base")({
  component: BasePage,
});

type ColKind = "text" | "number" | "date";
type Col = { key: keyof Lancamento; label: string; kind: ColKind; width: number };

const COLS: Col[] = [
  { key: "prePedido", label: "Pré-Pedido", kind: "number", width: 110 },
  { key: "issuer", label: "Colaborador", kind: "text", width: 140 },
  { key: "supplier", label: "Fornecedor", kind: "text", width: 260 },
  { key: "invoiceNumber", label: "Nº Nota", kind: "text", width: 160 },
  { key: "accountGroup", label: "Grupo Conta", kind: "text", width: 140 },
  { key: "center", label: "Centro", kind: "text", width: 120 },
  { key: "company", label: "Cód. Empresa", kind: "number", width: 120 },
  { key: "Empresa", label: "Empresa", kind: "text", width: 140 },
  { key: "dueDate", label: "Vencimento", kind: "date", width: 150 },
  { key: "registerDate", label: "Lançamento", kind: "date", width: 150 },
  { key: "grossAmount", label: "Valor Bruto", kind: "number", width: 130 },
  { key: "descStatus", label: "Status", kind: "text", width: 130 },
  { key: "action", label: "Modalidade", kind: "text", width: 130 },
  { key: "log", label: "Log", kind: "text", width: 180 },
  { key: "text", label: "Texto", kind: "text", width: 200 },
];

const brl = (n: number | null | undefined) =>
  n == null
    ? ""
    : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function BasePage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { data, isLoading, error } = useQuery({
    queryKey: lancamentosQueryKey,
    queryFn: fetchAllLancamentos,
    enabled: !!user,
    staleTime: 30_000,
  });

  const [search, setSearch] = useState("");
  const [novoQty, setNovoQty] = useState(1);
  const [novoOpen, setNovoOpen] = useState(false);
  const [sortKey, setSortKey] = useState<keyof Lancamento>("dueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [pendingDelete, setPendingDelete] = useState<Lancamento | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: lancamentosQueryKey });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Lancamento> }) =>
      updateLancamento(id, patch),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error("Falha ao salvar: " + e.message),
  });

  const createMut = useMutation({
    mutationFn: (qty: number) => {
      if (qty <= 1) return createLancamento({}).then(() => 1);
      // Mocking bulk create via repeated calls for simplicity unless a bulk function exists
      // The requirement says "add new line", let's check if createLancamento supports bulk.
      // Based on src/lib/lancamentos.ts, we might need a loop or a bulk fn.
      const promises = Array.from({ length: qty }).map(() => createLancamento({}));
      return Promise.all(promises).then((results) => results.length);
    },
    onSuccess: (n) => {
      invalidate();
      toast.success(`${n} nova(s) linha(s) adicionada(s)`);
      setNovoOpen(false);
    },
    onError: (e: Error) => toast.error("Falha ao inserir: " + e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteLancamento(id),
    onSuccess: () => {
      invalidate();
      toast.success("Registro excluído");
    },
    onError: (e: Error) => toast.error("Falha ao excluir: " + e.message),
  });

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<"incremental" | "substituir">("incremental");

  const importMut = useMutation({
    mutationFn: async (file: File) => {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
      if (json.length === 0) throw new Error("Planilha vazia");

      const norm = (v: string) => v.toString().trim().toLowerCase();
      const mapa = new Map(LANCAMENTO_COLUNAS.map((c) => [norm(c.label), c]));
      const registros = json.map((linha) => {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(linha)) {
          const col = mapa.get(norm(k));
          if (!col || v == null || v === "") continue;
          if (col.tipo === "numero") {
            const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", "."));
            out[col.key] = Number.isFinite(n) ? n : null;
          } else if (col.tipo === "data") {
            const d = v instanceof Date ? v : new Date(String(v));
            out[col.key] = Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
          } else {
            out[col.key] = String(v);
          }
        }
        return out as Partial<Lancamento>;
      }).filter((r) => Object.keys(r).length > 0);

      if (registros.length === 0) throw new Error("Nenhuma coluna reconhecida. Baixe o modelo e confira os cabeçalhos.");
      return importLancamentosBulk(registros, importMode === "substituir");
    },
    onSuccess: (qtd) => {
      invalidate();
      setImportOpen(false);
      toast.success(`${qtd.toLocaleString("pt-BR")} registros importados`);
    },
    onError: (e: Error) => toast.error("Falha na importação: " + e.message),
  });

  const baixarModelo = () => {
    const ws = XLSX.utils.aoa_to_sheet([LANCAMENTO_COLUNAS.map((c) => c.label)]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Base");
    XLSX.writeFile(wb, "modelo-base-resultados.xlsx");
  };

  const exportarBase = () => {
    const dados = (data ?? []).map((r) =>
      Object.fromEntries(LANCAMENTO_COLUNAS.map((c) => [c.label, r[c.key] ?? ""])),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dados), "Base");
    XLSX.writeFile(wb, `base-resultados-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const rows = useMemo(() => {
    const list = data ?? [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? list.filter((r) =>
          COLS.some((c) => {
            const v = r[c.key];
            return v != null && String(v).toLowerCase().includes(q);
          }),
        )
      : list;
    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv), "pt-BR");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [data, search, sortKey, sortDir]);

  const toggleSort = (k: keyof Lancamento) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <Link to="/" className="flex flex-1 items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/profarma.png" alt="Profarma" className="h-7 object-contain" />
              <div>
                <h1 className="text-sm font-semibold text-foreground">Base de Resultados Principais</h1>
                <p className="text-[10px] text-muted-foreground">
                  {isLoading
                    ? "Carregando…"
                    : error
                      ? "Erro ao carregar"
                      : `${rows.length.toLocaleString("pt-BR")} registros`}
                </p>
              </div>
            </Link>
            <div className="relative w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar em toda a base…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" /> Importar Excel
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={exportarBase}>
              <Download className="h-4 w-4" /> Exportar
            </Button>
            <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> Nova linha
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Adicionar novas linhas</DialogTitle>
                  <DialogDescription>
                    Selecione a quantidade de linhas que deseja adicionar à base (máx. 50).
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="qty" className="text-right">Quantidade</Label>
                    <Input
                      id="qty"
                      type="number"
                      min={1}
                      max={50}
                      value={novoQty}
                      onChange={(e) => setNovoQty(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNovoOpen(false)}>Cancelar</Button>
                  <Button
                    onClick={() => createMut.mutate(novoQty)}
                    disabled={createMut.isPending}
                  >
                    {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Confirmar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </header>

          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar base de resultados</DialogTitle>
                <DialogDescription>
                  Selecione o modo de importação e envie a planilha. Os cabeçalhos devem seguir o modelo.
                </DialogDescription>
              </DialogHeader>
              <RadioGroup
                value={importMode}
                onValueChange={(v) => setImportMode(v as "incremental" | "substituir")}
                className="gap-3"
              >
                <div className="flex items-start gap-2 rounded-md border border-border p-3">
                  <RadioGroupItem value="incremental" id="modo-incremental" className="mt-0.5" />
                  <Label htmlFor="modo-incremental" className="cursor-pointer font-normal">
                    <span className="font-medium">Incremental</span>
                    <span className="block text-xs text-muted-foreground">Adiciona aos registros existentes.</span>
                  </Label>
                </div>
                <div className="flex items-start gap-2 rounded-md border border-border p-3">
                  <RadioGroupItem value="substituir" id="modo-substituir" className="mt-0.5" />
                  <Label htmlFor="modo-substituir" className="cursor-pointer font-normal">
                    <span className="font-medium">Substituir a base</span>
                    <span className="block text-xs text-muted-foreground">
                      Remove os registros atuais (exclusão lógica, restaurável em Auditoria) antes de importar.
                    </span>
                  </Label>
                </div>
              </RadioGroup>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) importMut.mutate(f);
                }}
              />
              <DialogFooter className="gap-2 sm:justify-between">
                <Button variant="ghost" size="sm" className="gap-1" onClick={baixarModelo}>
                  <FileSpreadsheet className="h-4 w-4" /> Baixar modelo
                </Button>
                <Button
                  size="sm"
                  className="gap-1"
                  disabled={importMut.isPending}
                  onClick={() => fileRef.current?.click()}
                >
                  {importMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Selecionar planilha
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <main className="flex-1 overflow-hidden p-4">
            <div className="relative h-[calc(100vh-8rem)] overflow-auto rounded-lg border border-border bg-card">
              {isLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isLoading && (
                <table className="min-w-full border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                    <tr>
                      <th className="w-10 border-b border-border px-2 py-2 text-left text-xs font-semibold text-muted-foreground">
                        #
                      </th>
                      {COLS.map((c) => (
                        <th
                          key={String(c.key)}
                          style={{ minWidth: c.width }}
                          className="cursor-pointer select-none border-b border-r border-border px-2 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted"
                          onClick={() => toggleSort(c.key)}
                        >
                          <div className="flex items-center gap-1">
                            {c.label}
                            {sortKey === c.key ? (
                              sortDir === "asc" ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-40" />
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="sticky right-0 z-10 w-12 border-b border-border bg-muted/95 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.id} className="group hover:bg-muted/40">
                        <td className="border-b border-border px-2 py-1 text-xs text-muted-foreground">
                          {i + 1}
                        </td>
                        {COLS.map((c) => (
                          <EditableCell
                            key={String(c.key)}
                            row={r}
                            col={c}
                            onSave={(patch) =>
                              updateMut.mutate({ id: r.id, patch })
                            }
                          />
                        ))}
                        <td className="sticky right-0 z-0 border-b border-border bg-card px-2 py-1 group-hover:bg-muted/40">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setPendingDelete(r)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={COLS.length + 2}
                          className="px-4 py-16 text-center text-sm text-muted-foreground"
                        >
                          Nenhum registro. Clique em "Nova linha" para começar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </main>
        </div>
      </div>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é permanente e removerá a linha da Base. O dashboard
              Principal será atualizado automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteMut.mutate(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}

function EditableCell({
  row,
  col,
  onSave,
}: {
  row: Lancamento;
  col: Col;
  onSave: (patch: Partial<Lancamento>) => void;
}) {
  const raw = row[col.key];
  const initialStr =
    raw == null
      ? ""
      : col.kind === "number"
        ? String(raw)
        : String(raw);

  const [value, setValue] = useState(initialStr);
  const [editing, setEditing] = useState(false);

  // If server value changes (e.g. after mutation refetch), sync when not editing.
  const syncedStr = raw == null ? "" : String(raw);
  if (!editing && value !== syncedStr) {
    // safe: set inside render only on change to avoid loop
    setValue(syncedStr);
  }

  const commit = () => {
    setEditing(false);
    if (value === syncedStr) return;
    let parsed: string | number | null;
    if (value === "") parsed = null;
    else if (col.kind === "number") {
      const n = Number(value.replace(",", "."));
      if (Number.isNaN(n)) {
        setValue(syncedStr);
        return;
      }
      parsed = n;
    } else {
      parsed = value;
    }
    onSave({ [col.key]: parsed } as Partial<Lancamento>);
  };

  const display =
    col.kind === "number" && col.key === "grossAmount"
      ? brl(raw as number | null)
      : initialStr;

  return (
    <td
      style={{ minWidth: col.width }}
      className="border-b border-r border-border p-0"
    >
      {editing ? (
        <input
          autoFocus
          type={col.kind === "date" ? "date" : col.kind === "number" ? "text" : "text"}
          inputMode={col.kind === "number" ? "decimal" : undefined}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") {
              setValue(syncedStr);
              setEditing(false);
            }
          }}
          className="w-full bg-background px-2 py-1.5 text-sm outline-none ring-2 ring-primary/60"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="block w-full truncate px-2 py-1.5 text-left text-sm hover:bg-muted/40"
          title={display || "—"}
        >
          {display || <span className="text-muted-foreground/60">—</span>}
        </button>
      )}
    </td>
  );
}
