import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  CheckSquare,
  Square,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import {
  bulkInsertProvisao,
  createProvisao,
  deleteProvisao,
  fetchAllProvisao,
  provisaoQueryKey,
  updateProvisao,
  type Provisao,
} from "@/lib/provisao";
import { useSession } from "@/hooks/use-session";
import { parseMoney, formatBRL } from "@/lib/money";
import { ImportPreviewDialog } from "@/components/import-preview-dialog";
import { analisarArquivo, extrairLinhasValidas, formatoAceito, type CampoSpec, type PreviaImportacao } from "@/lib/import-preview";

export const Route = createFileRoute("/provisao/base")({
  component: ProvisaoBasePage,
});

type ColKind = "text" | "number" | "date";
type Col = { key: keyof Provisao; label: string; kind: ColKind; width: number };

const COLS: Col[] = [
  { key: "data", label: "Data", kind: "date", width: 150 },
  { key: "empresa", label: "Empresa", kind: "text", width: 200 },
  { key: "banco", label: "Banco", kind: "text", width: 160 },
  { key: "valor", label: "Valor", kind: "number", width: 160 },
];

const brl = formatBRL;

/** Campos obrigatórios da Base da Provisão + variações aceitas de cabeçalho. */
const CAMPOS_IMPORT: CampoSpec[] = [
  { key: "data", label: "Data", tipo: "data", obrigatorio: true, aliases: ["dt", "data de pagamento", "data de credito", "data credito", "vencimento", "data pgto"] },
  { key: "empresa", label: "Empresa", tipo: "texto", obrigatorio: true, aliases: ["coligada", "cliente", "razao social"] },
  { key: "banco", label: "Banco", tipo: "texto", obrigatorio: true, aliases: ["bank", "instituicao", "banco pagador"] },
  { key: "valor", label: "Valor", tipo: "valor", obrigatorio: true, aliases: ["valor total", "valor lg", "vlr", "valor pago", "valor liquido"] },
];

// Excel serial date → YYYY-MM-DD
function excelSerialToISO(serial: number): string {
  // Excel epoch 1899-12-30
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(ms).toISOString().slice(0, 10);
}

function parseDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return excelSerialToISO(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  // dd/mm/yyyy
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    let y = m[3];
    if (y.length === 2) y = "20" + y;
    return `${y}-${mo}-${d}`;
  }
  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function findKey(row: Record<string, unknown>, patterns: RegExp[]): string | undefined {
  return Object.keys(row).find((k) =>
    patterns.some((p) => p.test(k.trim().toLowerCase())),
  );
}

function ProvisaoBasePage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { user } = useSession();
  const { data, isLoading, error } = useQuery({
    queryKey: provisaoQueryKey,
    queryFn: fetchAllProvisao,
    enabled: !!user,
    staleTime: 30_000,
  });

  const [search, setSearch] = useState("");
  const [importMode, setImportMode] = useState<"incremental" | "replace">("incremental");
  const [sortKey, setSortKey] = useState<keyof Provisao>("data");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [pendingDelete, setPendingDelete] = useState<Provisao | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  // Pré-validação obrigatória da importação
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<PreviaImportacao | null>(null);
  const [previaOpen, setPreviaOpen] = useState(false);
  const [analisando, setAnalisando] = useState(false);
  const [mapManual, setMapManual] = useState<Record<string, string | null>>({});
  const [abaEscolhida, setAbaEscolhida] = useState<string | undefined>(undefined);

  const invalidate = () => qc.invalidateQueries({ queryKey: provisaoQueryKey });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Provisao> }) =>
      updateProvisao(id, patch),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error("Falha ao salvar: " + e.message),
  });

  const createMut = useMutation({
    mutationFn: () => createProvisao({ data: new Date().toISOString().slice(0, 10) }),
    onSuccess: () => {
      invalidate();
      toast.success("Nova linha adicionada");
    },
    onError: (e: Error) => toast.error("Falha ao inserir: " + e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProvisao(id),
    onSuccess: () => {
      invalidate();
      toast.success("Registro excluído");
    },
    onError: (e: Error) => toast.error("Falha ao excluir: " + e.message),
  });

  const bulkDeleteMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { bulkDeleteProvisao } = await import("@/lib/provisao");
      return bulkDeleteProvisao(ids);
    },
    onSuccess: (count) => {
      invalidate();
      toast.success(`${count} registros excluídos com sucesso.`);
      setSelectedIds(new Set());
      setIsBulkDeleteDialogOpen(false);
    },
    onError: (e: Error) => toast.error("Falha ao excluir registros: " + e.message),
  });

  const analisar = async (
    file: File,
    aba?: string,
    mapeamentoManual?: Record<string, string | null>,
  ) => {
    setAnalisando(true);
    try {
      const p = await analisarArquivo(file, { campos: CAMPOS_IMPORT, aba, mapeamentoManual });
      setPrevia(p);
      setPreviaOpen(true);
    } catch (e) {
      setPreviaOpen(false);
      setPrevia(null);
      toast.error((e as Error).message);
    } finally {
      setAnalisando(false);
    }
  };

  const importMut = useMutation({
    mutationFn: async () => {
      if (!arquivo) throw new Error("Nenhum arquivo selecionado.");
      const linhas = await extrairLinhasValidas(arquivo, {
        campos: CAMPOS_IMPORT,
        aba: abaEscolhida,
        mapeamentoManual: mapManual,
      });
      const mapped = linhas.map((l) => ({
        data: (l.data as string) ?? null,
        empresa: (l.empresa as string) ?? null,
        banco: (l.banco as string) ?? null,
        valor: (l.valor as number) ?? null,
      }));
      return bulkInsertProvisao(mapped, importMode === "replace");
    },
    onSuccess: (count) => {
      invalidate();
      setPreviaOpen(false);
      setPrevia(null);
      setArquivo(null);
      setMapManual({});
      setAbaEscolhida(undefined);
      toast.success(`Importação concluída com sucesso. ${count} registro(s) gravado(s).`);
    },
    onError: (e: Error) =>
      toast.error(
        "Não foi possível importar o arquivo. " + e.message,
      ),
  });

  const onImportClick = () => fileRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!formatoAceito(f.name)) {
      toast.error("Use Excel (.xlsx/.xls), CSV ou TXT estruturado. PDF/Word não alimentam a base.");
      return;
    }
    setArquivo(f);
    setMapManual({});
    setAbaEscolhida(undefined);
    void analisar(f);
  };

  const exportXlsx = () => {
    const list = (data ?? []).map((r) => ({
      Data: r.data ?? "",
      Empresa: r.empresa ?? "",
      Banco: r.banco ?? "",
      Valor: r.valor ?? 0,
    }));
    const ws = XLSX.utils.json_to_sheet(list);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Provisao");
    XLSX.writeFile(wb, `provisao-diaria-${new Date().toISOString().slice(0, 10)}.xlsx`);
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

  const toggleSort = (k: keyof Provisao) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  return (
    <main className="flex-1 p-4">
      <div className="mb-3 flex flex-col gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Base da Provisão</h2>
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? "Carregando…"
              : error
                ? "Erro ao carregar"
                : `${rows.length.toLocaleString("pt-BR")} registros`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => createMut.mutate()}
            disabled={createMut.isPending}
            className="gap-1"
          >
            <Plus className="h-4 w-4" /> Nova
          </Button>
          {selectedIds.size > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setIsBulkDeleteDialogOpen(true)}
              className="gap-1 animate-in fade-in slide-in-from-left-2"
            >
              <Trash2 className="h-4 w-4" /> Excluir ({selectedIds.size})
            </Button>
          )}
          <Select value={importMode} onValueChange={(v: any) => setImportMode(v)}>
            <SelectTrigger className="h-9 w-[180px] text-xs">
              <SelectValue placeholder="Modo de importação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="incremental">Incremental (adicionar)</SelectItem>
              <SelectItem value="replace">Substituir a base (apagar)</SelectItem>
            </SelectContent>
          </Select>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv,.txt"
            className="hidden"
            onChange={onFileChange}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={onImportClick}
            disabled={importMut.isPending}
            className="gap-1"
          >
            {importMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Importar
          </Button>
          <Button size="sm" onClick={exportXlsx} className="gap-1">
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>


      <div className="relative h-[calc(100vh-11rem)] overflow-auto rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
              <tr>
                <th className="w-10 border-b border-border px-2 py-2 text-center text-xs font-semibold text-muted-foreground">
                  <Checkbox
                    checked={rows.length > 0 && selectedIds.size === rows.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedIds(new Set(rows.map(r => r.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                    aria-label="Selecionar todos"
                  />
                </th>
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
                <tr 
                  key={r.id} 
                  className={`group hover:bg-muted/40 ${selectedIds.has(r.id) ? 'bg-primary/5' : ''}`}
                >
                  <td className="border-b border-border px-2 py-1 text-center">
                    <Checkbox
                      checked={selectedIds.has(r.id)}
                      onCheckedChange={(checked) => {
                        const next = new Set(selectedIds);
                        if (checked) next.add(r.id);
                        else next.delete(r.id);
                        setSelectedIds(next);
                      }}
                      aria-label={`Selecionar linha ${i + 1}`}
                    />
                  </td>
                  <td className="border-b border-border px-2 py-1 text-xs text-muted-foreground">
                    {i + 1}
                  </td>
                  {COLS.map((c) => (
                    <EditableCell
                      key={String(c.key)}
                      row={r}
                      col={c}
                      onSave={(patch) => updateMut.mutate({ id: r.id, patch })}
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
                    colSpan={COLS.length + 3}
                    className="px-4 py-16 text-center text-sm text-muted-foreground"
                  >
                    Nenhum registro. Use "Nova" ou "Importar".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <ImportPreviewDialog
        open={previaOpen}
        onOpenChange={(o) => {
          setPreviaOpen(o);
          if (!o) {
            setPrevia(null);
            setArquivo(null);
          }
        }}
        previa={previa}
        campos={CAMPOS_IMPORT}
        analisando={analisando}
        gravando={importMut.isPending}
        modo={importMode}
        onModoChange={setImportMode}
        onAbaChange={(aba) => {
          setAbaEscolhida(aba);
          if (arquivo) void analisar(arquivo, aba, mapManual);
        }}
        onMapear={(campoKey, header) => {
          const next = { ...mapManual, [campoKey]: header };
          setMapManual(next);
          if (arquivo) void analisar(arquivo, abaEscolhida, next);
        }}
        onConfirmar={() => importMut.mutate()}
      />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é permanente e removerá a linha da Base da Provisão.
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

      <AlertDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registros selecionados?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir <b>{selectedIds.size}</b> registros permanentemente da Base da Provisão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                bulkDeleteMut.mutate(Array.from(selectedIds));
              }}
            >
              {bulkDeleteMut.isPending ? "Excluindo..." : "Excluir Todos"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function EditableCell({
  row,
  col,
  onSave,
}: {
  row: Provisao;
  col: Col;
  onSave: (patch: Partial<Provisao>) => void;
}) {
  const raw = row[col.key];
  const syncedStr = raw == null ? "" : String(raw);
  const [value, setValue] = useState(syncedStr);
  const [editing, setEditing] = useState(false);

  if (!editing && value !== syncedStr) setValue(syncedStr);

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
    } else parsed = value;
    onSave({ [col.key]: parsed } as Partial<Provisao>);
  };

  const display =
    col.kind === "number" && col.key === "valor"
      ? brl(raw as number | null)
      : col.kind === "date" && syncedStr
        ? syncedStr.split("-").reverse().join("/")
        : syncedStr;

  return (
    <td
      style={{ minWidth: col.width }}
      className="border-b border-r border-border p-0"
    >
      {editing ? (
        <input
          autoFocus
          type={col.kind === "date" ? "date" : "text"}
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
