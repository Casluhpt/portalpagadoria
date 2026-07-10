import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertCircle, Loader2, Search, ShieldAlert, Trash2, FileText, Receipt,
  Folder, FolderOpen, ChevronRight, X,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRoles } from "@/hooks/use-roles";
import { listRegistrosExcluidos, type RegistroExcluido } from "@/lib/registros-excluidos.functions";

export const Route = createFileRoute("/registros-excluidos")({
  component: RegistrosExcluidosPage,
});

function RegistrosExcluidosPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold text-foreground">Registros Excluídos</h1>
            <div className="ml-auto"><HeaderActions /></div>
          </header>
          <Content />
        </div>
      </div>
    </SidebarProvider>
  );
}

function Content() {
  const { isAdmin, loading } = useRoles();
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Acesso restrito</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Somente administradores podem visualizar registros excluídos.
        </p>
      </div>
    );
  }
  return <Board />;
}

function empresaOf(r: RegistroExcluido): string {
  const s = r.snapshot ?? {};
  const raw = (s.empresa ?? s.supplier ?? s.issuer ?? "SEM EMPRESA") as string;
  return String(raw).trim() || "SEM EMPRESA";
}

function Board() {
  const listFn = useServerFn(listRegistrosExcluidos);

  const [search, setSearch] = useState("");
  const [origem, setOrigem] = useState<"todos" | "pagamento" | "lancamento">("todos");
  const [usuario, setUsuario] = useState<string>("todos");
  const [periodo, setPeriodo] = useState<"todos" | "7" | "30" | "90">("todos");
  const [empresaAberta, setEmpresaAberta] = useState<string | null>(null);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["registros-excluidos"],
    queryFn: () => listFn({}),
    staleTime: 30_000,
  });

  const usuarios = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => r.user_nome && set.add(r.user_nome));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cutoff = periodo === "todos" ? 0 : Date.now() - Number(periodo) * 24 * 60 * 60 * 1000;
    return data.filter((r) => {
      if (origem !== "todos" && r.origem !== origem) return false;
      if (usuario !== "todos" && r.user_nome !== usuario) return false;
      if (cutoff && new Date(r.created_at).getTime() < cutoff) return false;
      if (!q) return true;
      const s = JSON.stringify(r.snapshot ?? {}).toLowerCase();
      return s.includes(q) || (r.user_nome ?? "").toLowerCase().includes(q);
    });
  }, [data, search, origem, usuario, periodo]);

  const grouped = useMemo(() => {
    const map = new Map<string, RegistroExcluido[]>();
    filtered.forEach((r) => {
      const key = empresaOf(r);
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const empresaSelecionada = empresaAberta
    ? grouped.find(([nome]) => nome === empresaAberta)
    : undefined;

  const clearFilters = () => {
    setSearch(""); setOrigem("todos"); setUsuario("todos"); setPeriodo("todos");
  };
  const filtrosAtivos = search || origem !== "todos" || usuario !== "todos" || periodo !== "todos";

  return (
    <div className="flex-1 space-y-4 p-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Área restrita ao Administrador — histórico dos registros apagados de Resultados e Lançamentos, organizados por empresa.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição, usuário, valor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 pl-8"
          />
        </div>
        <Select value={origem} onValueChange={(v) => setOrigem(v as any)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as origens</SelectItem>
            <SelectItem value="pagamento">Resultados</SelectItem>
            <SelectItem value="lancamento">Lançamentos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={usuario} onValueChange={setUsuario}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Usuário" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os usuários</SelectItem>
            {usuarios.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={periodo} onValueChange={(v) => setPeriodo(v as any)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo o período</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
        {filtrosAtivos && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3.5 w-3.5" /> Limpar
          </Button>
        )}
        <div className="ml-auto text-xs text-muted-foreground">
          {filtered.length} registro{filtered.length === 1 ? "" : "s"} • {grouped.length} empresa{grouped.length === 1 ? "" : "s"}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {(error as any)?.message ?? "Falha ao carregar registros excluídos."}
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Nenhum registro excluído encontrado com os filtros atuais.
        </div>
      ) : empresaSelecionada ? (
        <EmpresaAberta
          nome={empresaSelecionada[0]}
          registros={empresaSelecionada[1]}
          onVoltar={() => setEmpresaAberta(null)}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {grouped.map(([nome, itens]) => (
            <PastaEmpresa
              key={nome}
              nome={nome}
              registros={itens}
              onOpen={() => setEmpresaAberta(nome)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PastaEmpresa({
  nome, registros, onOpen,
}: { nome: string; registros: RegistroExcluido[]; onOpen: () => void }) {
  const qtd = registros.length;
  const ultimo = registros[0]?.created_at;
  const pag = registros.filter((r) => r.origem === "pagamento").length;
  const lanc = registros.filter((r) => r.origem === "lancamento").length;

  return (
    <button
      onClick={onOpen}
      className="group relative flex flex-col items-start gap-2 rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary/50 hover:shadow-md"
    >
      {qtd > 0 && (
        <span className="absolute -left-1 top-3 z-10 inline-flex items-center gap-1 rounded-r-full bg-destructive px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive-foreground shadow">
          <AlertCircle className="h-3 w-3" /> {qtd}
        </span>
      )}
      <div className="flex w-full items-center justify-between">
        <Folder className="h-8 w-8 text-amber-500 transition group-hover:hidden" />
        <FolderOpen className="hidden h-8 w-8 text-amber-500 transition group-hover:block" />
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
      </div>
      <div className="w-full min-w-0">
        <p className="truncate text-sm font-semibold">{nome}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {ultimo ? `Último: ${format(new Date(ultimo), "dd/MM/yyyy HH:mm", { locale: ptBR })}` : "—"}
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        {pag > 0 && <Badge variant="outline" className="gap-1 text-[10px]"><Receipt className="h-3 w-3" />{pag}</Badge>}
        {lanc > 0 && <Badge variant="outline" className="gap-1 text-[10px]"><FileText className="h-3 w-3" />{lanc}</Badge>}
      </div>
    </button>
  );
}

function EmpresaAberta({
  nome, registros, onVoltar,
}: { nome: string; registros: RegistroExcluido[]; onVoltar: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Button variant="ghost" size="sm" onClick={onVoltar}>
          ← Voltar às pastas
        </Button>
        <div className="flex items-center gap-2 text-muted-foreground">
          <FolderOpen className="h-4 w-4 text-amber-500" />
          <span className="font-semibold text-foreground">{nome}</span>
          <span>• {registros.length} registro{registros.length === 1 ? "" : "s"}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {registros.map((r) => <RegistroCard key={r.id} row={r} />)}
      </div>
    </div>
  );
}

function fmtCurrency(v: any) {
  const n = typeof v === "number" ? v : parseFloat(v);
  if (!Number.isFinite(n)) return null;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function RegistroCard({ row }: { row: RegistroExcluido }) {
  const s = row.snapshot ?? {};
  const isPag = row.origem === "pagamento";
  const titulo = isPag
    ? (s.descricao_pagamento ?? s.natureza_pagamento ?? "Pagamento")
    : (s.invoice_number ? `NF ${s.invoice_number}` : (s.desc_status ?? "Lançamento"));
  const subtitulo = isPag
    ? (s.banco ?? s.natureza_pagamento ?? "—")
    : (s.supplier ?? s.issuer ?? "—");
  const valor = isPag ? fmtCurrency(s.valor_lg) : fmtCurrency(s.gross_amount);
  const data = isPag ? s.data_credito : (s.due_date ?? s.register_date);

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute left-0 top-0 flex h-full w-1.5 bg-destructive" aria-hidden />
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="absolute -left-1 top-3 z-10 inline-flex items-center gap-1 rounded-r-full bg-destructive px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive-foreground shadow hover:brightness-110"
            aria-label="Registro apagado — ver detalhes"
          >
            <AlertCircle className="h-3 w-3" /> Apagado
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-80 p-3 text-xs">
          <p className="mb-2 font-semibold text-foreground">Registro apagado permanentemente</p>
          <p className="text-muted-foreground">
            Este item foi removido de <strong>{isPag ? "Resultados" : "Lançamentos"}</strong> por{" "}
            <strong>{row.user_nome ?? "usuário desconhecido"}</strong> em{" "}
            {format(new Date(row.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}.
          </p>
          <p className="mt-2 text-muted-foreground">
            Restauração exclusiva do Administrador — solicite via chamado.
          </p>
        </PopoverContent>
      </Popover>

      <CardHeader className="pb-2 pl-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-sm font-semibold">{titulo}</CardTitle>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitulo}</p>
          </div>
          <Badge variant="outline" className="shrink-0 gap-1">
            {isPag ? <Receipt className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            {isPag ? "Resultado" : "Lançamento"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pl-6 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Valor</span>
          <span className="font-semibold text-foreground">{valor ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Data do registro</span>
          <span className="text-foreground">
            {data ? format(new Date(data), "dd/MM/yyyy", { locale: ptBR }) : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Excluído por</span>
          <span className="text-foreground">{row.user_nome ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Excluído em</span>
          <span className="text-foreground">
            {format(new Date(row.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
          </span>
        </div>

        <SnapshotViewer row={row} />
      </CardContent>
    </Card>
  );
}

// ---------------- Snapshot viewer ----------------

const LABELS: Record<string, string> = {
  empresa: "Empresa",
  banco: "Banco",
  celula: "Célula",
  arquivo_remessa: "Arquivo Remessa",
  tipo_arquivo: "Tipo de Arquivo",
  ev_saida_folha_mensal: "EV Saída Folha Mensal",
  data_credito: "Data do Crédito",
  descricao_pagamento: "Descrição do Pagamento",
  natureza_pagamento: "Natureza do Pagamento",
  valor_lg: "Valor LG",
  competencia: "Competência",
  folha: "Folha",
  qtde_colaboradores: "Qtd. Colaboradores",
  observacao: "Observação",
  valor_bankmanager: "Valor BankManager",
  status_bankmanager: "Status BankManager",
  valor_itau: "Valor Itaú",
  status_itau: "Status Itaú",
  colaborador_nome: "Registrado por",
  registrado_em: "Registrado em",
  registrado_por: "Registrado por (ID)",
  pre_pedido: "Pré-Pedido",
  issuer: "Emissor",
  supplier: "Fornecedor",
  invoice_number: "Nota Fiscal",
  account_group: "Grupo de Contas",
  center: "Centro",
  company: "Companhia",
  due_date: "Vencimento",
  gross_amount: "Valor Bruto",
  register_date: "Data do Registro",
  desc_status: "Status",
  log: "Log",
  text_field: "Observações",
  action: "Ação",
  id: "ID",
  created_at: "Criado em",
  updated_at: "Atualizado em",
};

const HIDDEN_KEYS = new Set(["id", "created_at", "updated_at"]);
const MONEY_KEYS = new Set(["valor_lg", "valor_bankmanager", "valor_itau", "gross_amount"]);
const DATE_KEYS = new Set(["data_credito", "due_date", "register_date", "registrado_em"]);

function prettyLabel(k: string) {
  return LABELS[k] ?? k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(k: string, v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  if (MONEY_KEYS.has(k)) {
    const n = typeof v === "number" ? v : parseFloat(v);
    if (Number.isFinite(n)) return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  if (DATE_KEYS.has(k)) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) {
      const withTime = String(v).includes("T") || String(v).includes(":");
      return format(d, withTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy", { locale: ptBR });
    }
  }
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function SnapshotViewer({ row }: { row: RegistroExcluido }) {
  const [open, setOpen] = useState(false);
  const s = row.snapshot ?? {};
  const entries = Object.entries(s)
    .filter(([k, v]) => !HIDDEN_KEYS.has(k) && v !== null && v !== undefined && v !== "")
    .sort((a, b) => prettyLabel(a[0]).localeCompare(prettyLabel(b[0])));
  const isPag = row.origem === "pagamento";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
      >
        <Trash2 className="h-3 w-3" /> Ver detalhes completos
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <DialogHeader className="border-b border-border bg-muted/40 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="truncate text-sm font-semibold">
                  Snapshot do registro excluído
                </DialogTitle>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {isPag ? "Resultados" : "Lançamentos"} • Excluído por{" "}
                  <span className="text-foreground">{row.user_nome ?? "—"}</span> em{" "}
                  {format(new Date(row.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                </p>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh]">
            <dl className="divide-y divide-border">
              {entries.length === 0 ? (
                <div className="px-5 py-8 text-center text-xs text-muted-foreground">
                  Snapshot vazio.
                </div>
              ) : (
                entries.map(([k, v]) => {
                  const label = prettyLabel(k);
                  const value = formatValue(k, v);
                  const long = value.length > 60;
                  return (
                    <div
                      key={k}
                      className={`grid gap-1 px-5 py-2.5 ${long ? "" : "grid-cols-[180px_1fr] items-baseline"}`}
                    >
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {label}
                      </dt>
                      <dd className={`text-xs text-foreground ${long ? "whitespace-pre-wrap break-words" : "text-right"}`}>
                        {value}
                      </dd>
                    </div>
                  );
                })
              )}
            </dl>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
