import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Search, ShieldAlert, ScrollText, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/use-roles";
import { useSession } from "@/hooks/use-session";
import { RegistrosExcluidosView } from "@/routes/registros-excluidos";
import { RestrictedArea } from "@/components/role-gate";
import { AcoesCriticasView } from "@/components/acoes-criticas-view";


type AuditTab = "log" | "criticas" | "excluidos";

export const Route = createFileRoute("/auditoria")({
  validateSearch: (s: Record<string, unknown>) => ({
    tab: (s.tab === "excluidos" || s.tab === "criticas" ? s.tab : "log") as AuditTab,
  }),
  component: AuditoriaPage,
});


type AuditRow = {
  id: string;
  pagamento_id: string | null;
  acao: "INSERT" | "UPDATE" | "DELETE" | string;
  user_id: string | null;
  user_nome: string | null;
  snapshot: Record<string, unknown> | null;
  created_at: string;
};

const brl = (n: unknown) => {
  const v = typeof n === "number" ? n : n == null ? null : Number(n);
  if (v == null || Number.isNaN(v)) return "";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const s = (v: unknown) => (v == null ? "" : String(v));

async function fetchAudit(): Promise<AuditRow[]> {
  const all: AuditRow[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("pagamentos_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as unknown as AuditRow[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

function AuditoriaPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="truncate text-sm font-semibold text-foreground">Auditoria</h1>
            <div className="ml-auto">
              <HeaderActions />
            </div>
          </header>
          <RestrictedArea area="Auditoria" anyOf={["administrador", "auditor"]}>
            <Tabs
              value={tab}
              onValueChange={(v) => navigate({ search: { tab: v as AuditTab }, replace: true })}
              className="flex flex-1 flex-col"
            >
              <div className="border-b border-border bg-background px-4 pt-3">
                <TabsList>
                  <TabsTrigger value="log" className="gap-1.5">
                    <ScrollText className="h-3.5 w-3.5" /> Log de Auditoria
                  </TabsTrigger>
                  <TabsTrigger value="criticas" className="gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Ações Críticas
                  </TabsTrigger>
                  <TabsTrigger value="excluidos" className="gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" /> Registros Excluídos
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="log" className="mt-0 flex-1">
                <AuditoriaContent />
              </TabsContent>
              <TabsContent value="criticas" className="mt-0 flex-1">
                <AcoesCriticasView />
              </TabsContent>
              <TabsContent value="excluidos" className="mt-0 flex-1">
                <RegistrosExcluidosView />
              </TabsContent>
            </Tabs>
          </RestrictedArea>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AuditoriaContent() {
  const { isAdmin, isAuditor, loading } = useRoles();
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin && !isAuditor) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Acesso restrito</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Somente administradores e auditores podem visualizar o log de auditoria.
        </p>
      </div>
    );
  }
  return <AuditoriaTable isAdmin={isAdmin} />;
}

function AuditoriaTable({ isAdmin }: { isAdmin: boolean }) {

  const { user } = useSession();
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["pagamentos_audit"],
    queryFn: fetchAudit,
    enabled: !!user,
    staleTime: 30_000,
  });

  const [colaborador, setColaborador] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [celula, setCelula] = useState("");
  const [competencia, setCompetencia] = useState("");
  const [dataDe, setDataDe] = useState("");
  const [dataAte, setDataAte] = useState("");
  const [valorMin, setValorMin] = useState("");
  const [valorMax, setValorMax] = useState("");
  const [acao, setAcao] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Unique dropdown options extracted from snapshots
  const options = useMemo(() => {
    const empresas = new Set<string>();
    const celulas = new Set<string>();
    const competencias = new Set<string>();
    for (const r of data) {
      const snap = r.snapshot ?? {};
      const e = s((snap as Record<string, unknown>).empresa);
      const c = s((snap as Record<string, unknown>).celula);
      const cp = s((snap as Record<string, unknown>).competencia);
      if (e) empresas.add(e);
      if (c) celulas.add(c);
      if (cp) competencias.add(cp);
    }
    const sort = (a: string, b: string) => a.localeCompare(b, "pt-BR");
    return {
      empresas: [...empresas].sort(sort),
      celulas: [...celulas].sort(sort),
      competencias: [...competencias].sort(sort),
    };
  }, [data]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const vmin = valorMin ? Number(valorMin.replace(",", ".")) : null;
    const vmax = valorMax ? Number(valorMax.replace(",", ".")) : null;
    return data.filter((r) => {
      const snap = (r.snapshot ?? {}) as Record<string, unknown>;
      const rowEmpresa = s(snap.empresa);
      const rowCelula = s(snap.celula);
      const rowComp = s(snap.competencia);
      const rowColab = s(r.user_nome ?? snap.colaborador_nome);
      const rowValor = snap.valor_lg == null ? null : Number(snap.valor_lg);
      const rowDataStr = r.created_at.slice(0, 10);

      if (acao !== "all" && r.acao !== acao) return false;
      if (colaborador && !rowColab.toLowerCase().includes(colaborador.toLowerCase())) return false;
      if (empresa && rowEmpresa !== empresa) return false;
      if (celula && rowCelula !== celula) return false;
      if (competencia && rowComp !== competencia) return false;
      if (dataDe && rowDataStr < dataDe) return false;
      if (dataAte && rowDataStr > dataAte) return false;
      if (vmin != null && (rowValor == null || rowValor < vmin)) return false;
      if (vmax != null && (rowValor == null || rowValor > vmax)) return false;
      if (q) {
        const hay = [
          rowColab, rowEmpresa, rowCelula, rowComp,
          s(snap.descricao_pagamento), s(snap.banco), s(snap.folha),
        ].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, search, acao, colaborador, empresa, celula, competencia, dataDe, dataAte, valorMin, valorMax]);

  const clear = () => {
    setColaborador(""); setEmpresa(""); setCelula(""); setCompetencia("");
    setDataDe(""); setDataAte(""); setValorMin(""); setValorMax("");
    setAcao("all"); setSearch("");
  };

  return (
    <div className="flex flex-1 flex-col p-4">
      {/* Filters */}
      <div className="mb-3 grid grid-cols-1 gap-2 rounded-lg border border-border bg-card p-3 md:grid-cols-4 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Label className="text-xs">Pesquisar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Descrição, banco, folha…" className="pl-8 h-9" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Ação</Label>
          <Select value={acao} onValueChange={setAcao}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="INSERT">Inserção</SelectItem>
              <SelectItem value="UPDATE">Edição</SelectItem>
              <SelectItem value="DELETE">Exclusão</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Colaborador</Label>
          <Input value={colaborador} onChange={(e) => setColaborador(e.target.value)} placeholder="Nome…" className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Empresa</Label>
          <Select value={empresa || "all"} onValueChange={(v) => setEmpresa(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {options.empresas.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Célula</Label>
          <Select value={celula || "all"} onValueChange={(v) => setCelula(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {options.celulas.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Competência</Label>
          <Select value={competencia || "all"} onValueChange={(v) => setCompetencia(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {options.competencias.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Data de</Label>
          <Input type="date" value={dataDe} onChange={(e) => setDataDe(e.target.value)} className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Data até</Label>
          <Input type="date" value={dataAte} onChange={(e) => setDataAte(e.target.value)} className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Valor mín. (R$)</Label>
          <Input inputMode="decimal" value={valorMin} onChange={(e) => setValorMin(e.target.value)} placeholder="0,00" className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Valor máx. (R$)</Label>
          <Input inputMode="decimal" value={valorMax} onChange={(e) => setValorMax(e.target.value)} placeholder="0,00" className="h-9" />
        </div>
        <div className="flex items-end">
          <Button variant="outline" size="sm" className="w-full" onClick={clear}>Limpar filtros</Button>
        </div>
      </div>

      <div className="mb-2 text-xs text-muted-foreground">
        {isLoading ? "Carregando…" : error ? "Erro ao carregar." : `${rows.length.toLocaleString("pt-BR")} registro(s)`}
      </div>

      <div className="relative flex-1 overflow-auto rounded-lg border border-border bg-card">
        <table className="min-w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
            <tr>
              <th className="border-b border-border px-2 py-2 text-left font-semibold">Data / Hora</th>
              <th className="border-b border-border px-2 py-2 text-left font-semibold">Ação</th>
              <th className="border-b border-border px-2 py-2 text-left font-semibold">Colaborador</th>
              <th className="border-b border-border px-2 py-2 text-left font-semibold">Empresa</th>
              <th className="border-b border-border px-2 py-2 text-left font-semibold">Célula</th>
              <th className="border-b border-border px-2 py-2 text-left font-semibold">Competência</th>
              <th className="border-b border-border px-2 py-2 text-left font-semibold">Descrição</th>
              <th className="border-b border-border px-2 py-2 text-right font-semibold">Valor LG</th>
              <th className="border-b border-border px-2 py-2 text-left font-semibold">ID lançamento</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const snap = (r.snapshot ?? {}) as Record<string, unknown>;
              const badgeVariant =
                r.acao === "DELETE" ? "destructive" :
                r.acao === "UPDATE" ? "secondary" : "default";
              const acaoLabel =
                r.acao === "DELETE" ? "Excluído" :
                r.acao === "UPDATE" ? "Editado" :
                r.acao === "INSERT" ? "Criado" : r.acao;
              return (
                <tr key={r.id} className="hover:bg-muted/40">
                  <td className="whitespace-nowrap border-b border-border px-2 py-1">
                    {format(new Date(r.created_at), "dd/MM/yyyy HH:mm:ss")}
                  </td>
                  <td className="border-b border-border px-2 py-1">
                    <Badge variant={badgeVariant}>{acaoLabel}</Badge>
                  </td>
                  <td className="border-b border-border px-2 py-1">{s(r.user_nome ?? snap.colaborador_nome) || "—"}</td>
                  <td className="border-b border-border px-2 py-1">{s(snap.empresa) || "—"}</td>
                  <td className="border-b border-border px-2 py-1">{s(snap.celula) || "—"}</td>
                  <td className="border-b border-border px-2 py-1">{s(snap.competencia) || "—"}</td>
                  <td className="max-w-[280px] truncate border-b border-border px-2 py-1" title={s(snap.descricao_pagamento)}>
                    {s(snap.descricao_pagamento) || "—"}
                  </td>
                  <td className="whitespace-nowrap border-b border-border px-2 py-1 text-right font-mono">
                    {brl(snap.valor_lg)}
                  </td>
                  <td className="border-b border-border px-2 py-1 font-mono text-[10px] text-muted-foreground">
                    {r.pagamento_id?.slice(0, 8) ?? "—"}
                  </td>
                </tr>
              );
            })}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  Nenhum registro encontrado com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
