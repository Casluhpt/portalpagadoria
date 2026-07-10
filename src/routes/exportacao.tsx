import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import {
  Download, FileSpreadsheet, FileText, FileType, Loader2,
  Wallet, Landmark, ClipboardList, ShieldCheck,
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/exportacao")({
  component: ExportacaoPage,
});

type Formato = "xlsx" | "csv" | "pdf";

type BaseKey = "pagamentos_diversos" | "provisao_diaria" | "lancamentos" | "pagamentos_audit";

type BaseDef = {
  key: BaseKey;
  titulo: string;
  descricao: string;
  icon: typeof Wallet;
  cor: string;
  dateColumn: string | null;
  orderColumn: string;
};

const BASES: BaseDef[] = [
  {
    key: "pagamentos_diversos",
    titulo: "Pagamentos Diversos",
    descricao: "Base completa de lançamentos com valores, empresa, banco e status.",
    icon: Wallet,
    cor: "from-blue-600 to-blue-800",
    dateColumn: "data_credito",
    orderColumn: "registrado_em",
  },
  {
    key: "provisao_diaria",
    titulo: "Base de Provisão",
    descricao: "Valores consolidados por dia, empresa e banco.",
    icon: Landmark,
    cor: "from-emerald-600 to-emerald-800",
    dateColumn: "data",
    orderColumn: "data",
  },
  {
    key: "lancamentos",
    titulo: "Lançamentos SAP",
    descricao: "Notas, fornecedores e centros de custo integrados.",
    icon: ClipboardList,
    cor: "from-amber-600 to-amber-800",
    dateColumn: "due_date",
    orderColumn: "register_date",
  },
  {
    key: "pagamentos_audit",
    titulo: "Log de Auditoria",
    descricao: "Histórico de inserções, edições e exclusões.",
    icon: ShieldCheck,
    cor: "from-slate-700 to-slate-900",
    dateColumn: "created_at",
    orderColumn: "created_at",
  },
];

const PAGE = 1000;

async function fetchAll(base: BaseDef, de: string, ate: string): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  let from = 0;
  while (true) {
    let q = supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(base.key as any)
      .select("*")
      .order(base.orderColumn, { ascending: false })
      .range(from, from + PAGE - 1);
    if (base.dateColumn && de) q = q.gte(base.dateColumn, de);
    if (base.dateColumn && ate) q = q.lte(base.dateColumn, ate);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as unknown as Record<string, unknown>[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(
    rows.reduce((s, r) => { Object.keys(r).forEach((k) => s.add(k)); return s; }, new Set<string>()),
  );
  const esc = (v: unknown) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(";")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(";"));
  return "\ufeff" + lines.join("\n");
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportXLSX(rows: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  download(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
}

function exportCSV(rows: Record<string, unknown>[], filename: string) {
  download(new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8" }), filename);
}

function exportPDF(rows: Record<string, unknown>[], titulo: string, filename: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const marginX = 24;
  let y = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(titulo, marginX, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")} — ${rows.length} registro(s)`, marginX, y + 12);
  y += 28;

  if (rows.length === 0) {
    doc.text("Nenhum registro encontrado no período.", marginX, y);
    doc.save(filename);
    return;
  }

  const headers = Object.keys(rows[0]);
  const colW = Math.max(60, Math.floor((doc.internal.pageSize.getWidth() - marginX * 2) / headers.length));

  doc.setFont("helvetica", "bold");
  headers.forEach((h, i) => doc.text(String(h).slice(0, 18), marginX + i * colW, y));
  y += 14;
  doc.setFont("helvetica", "normal");

  for (const r of rows) {
    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      y = 40;
    }
    headers.forEach((h, i) => {
      const v = r[h];
      const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      doc.text(s.slice(0, 22), marginX + i * colW, y);
    });
    y += 12;
  }
  doc.save(filename);
}

function ExportacaoPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold text-foreground">Exportação de Relatórios</h1>
            <div className="ml-auto"><HeaderActions /></div>
          </header>
          <ExportacaoContent />
        </div>
      </div>
    </SidebarProvider>
  );
}

function ExportacaoContent() {
  const hoje = format(new Date(), "yyyy-MM-dd");
  const primeiroDoMes = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
  const [dataDe, setDataDe] = useState(primeiroDoMes);
  const [dataAte, setDataAte] = useState(hoje);
  const [formato, setFormato] = useState<Formato>("xlsx");
  const [loadingKey, setLoadingKey] = useState<BaseKey | null>(null);

  async function handleExport(base: BaseDef) {
    setLoadingKey(base.key);
    try {
      const rows = await fetchAll(base, dataDe, dataAte);
      const stamp = format(new Date(), "yyyyMMdd_HHmm");
      const filename = `${base.key}_${stamp}.${formato}`;
      if (formato === "xlsx") exportXLSX(rows, filename);
      else if (formato === "csv") exportCSV(rows, filename);
      else exportPDF(rows, base.titulo, filename);
      toast.success(`${rows.length.toLocaleString("pt-BR")} registro(s) exportado(s).`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao exportar.");
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <main className="flex-1 space-y-6 p-6">
      {/* Filtros globais */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Parâmetros de exportação</CardTitle>
          <CardDescription>Defina o período e o formato antes de baixar cada base.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="text-xs">Data de</Label>
            <Input type="date" value={dataDe} onChange={(e) => setDataDe(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Data até</Label>
            <Input type="date" value={dataAte} onChange={(e) => setDataAte(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Formato</Label>
            <Select value={formato} onValueChange={(v) => setFormato(v as Formato)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx"><span className="inline-flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-emerald-600" />Excel (.xlsx)</span></SelectItem>
                <SelectItem value="csv"><span className="inline-flex items-center gap-2"><FileType className="h-4 w-4 text-blue-600" />CSV (.csv)</span></SelectItem>
                <SelectItem value="pdf"><span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-rose-600" />PDF (.pdf)</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" size="sm" className="w-full" onClick={() => { setDataDe(""); setDataAte(""); }}>
              Limpar período (tudo)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bases */}
      <div className="grid gap-4 md:grid-cols-2">
        {BASES.map((b) => {
          const Icon = b.icon;
          const loading = loadingKey === b.key;
          return (
            <Card key={b.key} className="border-border transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start gap-4">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${b.cor} text-white shadow`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{b.titulo}</h3>
                      {b.dateColumn ? (
                        <Badge variant="secondary" className="text-[10px]">filtra por {b.dateColumn}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">sem filtro de data</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{b.descricao}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <Button size="sm" onClick={() => handleExport(b)} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Exportar {formato.toUpperCase()}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Os arquivos são gerados no seu navegador e respeitam as permissões da sua conta.
      </p>
    </main>
  );
}
