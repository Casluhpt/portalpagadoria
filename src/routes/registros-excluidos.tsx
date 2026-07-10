import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, Loader2, Search, ShieldAlert, Trash2, FileText, Receipt } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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

function Board() {
  const listFn = useServerFn(listRegistrosExcluidos);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"todos" | "pagamento" | "lancamento">("todos");

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["registros-excluidos"],
    queryFn: () => listFn({}),
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((r) => {
      if (tab !== "todos" && r.origem !== tab) return false;
      if (!q) return true;
      const s = JSON.stringify(r.snapshot ?? {}).toLowerCase();
      return s.includes(q) || (r.user_nome ?? "").toLowerCase().includes(q);
    });
  }, [data, search, tab]);

  const totalPag = data.filter((r) => r.origem === "pagamento").length;
  const totalLanc = data.filter((r) => r.origem === "lancamento").length;

  return (
    <div className="flex-1 space-y-4 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Área restrita ao Administrador — histórico dos registros apagados de Resultados e Lançamentos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa, usuário, valor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 pl-8"
            />
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="todos">Todos <Badge variant="secondary" className="ml-2">{data.length}</Badge></TabsTrigger>
          <TabsTrigger value="pagamento">Resultados <Badge variant="secondary" className="ml-2">{totalPag}</Badge></TabsTrigger>
          <TabsTrigger value="lancamento">Lançamentos <Badge variant="secondary" className="ml-2">{totalLanc}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {(error as any)?.message ?? "Falha ao carregar registros excluídos."}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              Nenhum registro excluído encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((r) => <RegistroCard key={r.id} row={r} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
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
    ? (s.empresa ?? "Pagamento")
    : (s.supplier ?? s.issuer ?? s.empresa ?? "Lançamento");
  const subtitulo = isPag
    ? (s.descricao_pagamento ?? s.natureza_pagamento ?? "—")
    : (s.invoice_number ? `NF ${s.invoice_number}` : (s.desc_status ?? "—"));
  const valor = isPag ? fmtCurrency(s.valor_lg) : fmtCurrency(s.gross_amount);
  const data = isPag ? s.data_credito : (s.due_date ?? s.register_date);

  return (
    <Card className="relative overflow-hidden">
      {/* Popup lateral esquerdo: só aparece quando há registro efetivamente apagado */}
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

        <Popover>
          <PopoverTrigger asChild>
            <button className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
              <Trash2 className="h-3 w-3" /> Ver snapshot completo
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-96 p-0">
            <ScrollArea className="h-72">
              <pre className="whitespace-pre-wrap break-all p-3 text-[10px] leading-relaxed">
                {JSON.stringify(row.snapshot ?? {}, null, 2)}
              </pre>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}
