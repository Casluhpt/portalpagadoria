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
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

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

import {
  bulkInsertProvisao,
  createProvisao,
  deleteProvisao,
  fetchAllProvisao,
  provisaoQueryKey,
  updateProvisao,
  type Provisao,
} from "@/lib/provisao";

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

const brl = (n: number | null | undefined) =>
  n == null
    ? ""
    : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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

function parseNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v;
  const s = String(v)
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function findKey(row: Record<string, unknown>, patterns: RegExp[]): string | undefined {
  return Object.keys(row).find((k) =>
    patterns.some((p) => p.test(k.trim().toLowerCase())),
  );
}

function ProvisaoBasePage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: provisaoQueryKey,
    queryFn: fetchAllProvisao,
    staleTime: 30_000,
  });

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof Provisao>("data");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [pendingDelete, setPendingDelete] = useState<Provisao | null>(null);

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

  const importMut = useMutation({
    mutationFn: async (file: File) => {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        defval: null,
      });
      if (rows.length === 0) throw new Error("Planilha vazia.");
      const first = rows[0] as Record<string, unknown>;
      const dataKey = findKey(first, [/data.*cr[eé]dito/, /^data/, /vencimento/]);
      const empresaKey = findKey(first, [/empresa/, /cliente/]);
      const bancoKey = findKey(first, [/banco/]);
      const valorKey = findKey(first, [/valor.*lg/, /^valor/, /vlr/]);
      if (!dataKey || !empresaKey || !bancoKey || !valorKey) {
        throw new Error(
          "Colunas esperadas não encontradas. Verifique: DATA DE CREDITO, EMPRESA, BANCO, VALOR LG.",
        );
      }
      const mapped = rows
        .map((r) => ({
          data: parseDate(r[dataKey]),
          empresa: r[empresaKey] == null ? null : String(r[empresaKey]).trim(),
          banco: r[bancoKey] == null ? null : String(r[bancoKey]).trim(),
          valor: parseNumber(r[valorKey]),
        }))
        .filter((r) => r.data || r.empresa || r.banco || r.valor != null);
      return bulkInsertProvisao(mapped);
    },
    onSuccess: (count) => {
      invalidate();
      toast.success(`${count} registros importados`);
    },
    onError: (e: Error) => toast.error("Falha na importação: " + e.message),
  });

  const onImportClick = () => fileRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) importMut.mutate(f);
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
      <div className="mb-3 flex flex-wrap items-center gap-3">
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
        <div className="relative ml-auto w-64">
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
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
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

      <div className="relative h-[calc(100vh-11rem)] overflow-auto rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
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
                    colSpan={COLS.length + 2}
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
