import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { AppLogo } from "@/components/app-logo";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Download, GitBranch, Loader2, Search, Sparkles, ShieldCheck, Wrench, Bug,
} from "lucide-react";
import logoPagadoria from "@/assets/logo-pagadoria.png.asset.json";
import { useRoles } from "@/hooks/use-roles";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/historico")({
  component: HistoricoPage,
});

type Categoria = "novo" | "melhoria" | "correcao" | "seguranca";
type Item = { categoria: Categoria; descricao: string };
type Version = {
  versao: string;
  lancada_em: string;
  tipo: "major" | "minor" | "patch" | "hotfix";
  titulo: string;
  resumo: string | null;
  itens: Item[];
  autor: string | null;
  destaque: boolean;
};

const catMeta: Record<Categoria, { label: string; Icon: typeof Sparkles; color: string }> = {
  novo: { label: "Novo", Icon: Sparkles, color: "text-violet-600" },
  melhoria: { label: "Melhoria", Icon: Wrench, color: "text-blue-600" },
  correcao: { label: "Correção", Icon: Bug, color: "text-amber-600" },
  seguranca: { label: "Segurança", Icon: ShieldCheck, color: "text-emerald-600" },
};

const tipoVariant: Record<Version["tipo"], "default" | "secondary" | "outline" | "destructive"> = {
  major: "destructive",
  minor: "default",
  patch: "secondary",
  hotfix: "outline",
};

function compareVersions(a: string, b: string) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pb[i] ?? 0) - (pa[i] ?? 0);
    if (diff) return diff;
  }
  return 0;
}

function HistoricoPage() {
  const { isAdmin, loading } = useRoles();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="truncate text-sm font-semibold text-foreground">Histórico de Versões</h1>
            <div className="ml-auto"><HeaderActions /></div>
          </header>
          <Content />
        </div>
      </div>
    </SidebarProvider>
  );
}

function Content() {
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState<"todos" | Version["tipo"]>("todos");

  const { data: rawData = [], isLoading, error } = useQuery({
    queryKey: ["app-versions"],
    queryFn: async (): Promise<Version[]> => {
      const { data, error } = await (supabase as any)
        .from("app_versions")
        .select("*")
        .order("lancada_em", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((v: any) => ({
        ...v,
        itens: Array.isArray(v.itens) ? v.itens : [],
      }));
    },
  });

  const data = useMemo(() => [...rawData].sort((a: Version, b: Version) => compareVersions(a.versao, b.versao)), [rawData]);

  const versaoAtual = data[0]?.versao;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((v) => {
      if (tipo !== "todos" && v.tipo !== tipo) return false;
      if (!q) return true;
      const hay = [
        v.versao, v.titulo, v.resumo ?? "",
        ...v.itens.map((i) => `${i.categoria} ${i.descricao}`),
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [data, search, tipo]);

  const gerarPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 40;

    // Capa
    doc.setFillColor(76, 29, 149);
    doc.rect(0, 0, pageWidth, 90, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("Portal Pagadoria", marginX, 40);
    doc.setFontSize(12);
    doc.text("Histórico de Versões do Projeto", marginX, 62);
    doc.setFontSize(10);
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, marginX, 80);

    doc.setTextColor(30, 30, 30);
    let y = 120;

    if (versaoAtual) {
      doc.setFontSize(11);
      doc.text(`Versão atual: v${versaoAtual}`, marginX, y);
      y += 20;
    }

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Total de versões: ${data.length}`, marginX, y);
    y += 20;

    // Uma seção por versão
    data.forEach((v, idx) => {
      if (y > 720) { doc.addPage(); y = 60; }
      doc.setDrawColor(200, 200, 200);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 18;

      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.text(`v${v.versao} — ${v.titulo}`, marginX, y);

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      const meta = `${v.tipo.toUpperCase()}  •  ${format(new Date(v.lancada_em), "dd/MM/yyyy", { locale: ptBR })}${v.autor ? `  •  ${v.autor}` : ""}${v.destaque ? "  •  DESTAQUE" : ""}`;
      doc.text(meta, marginX, y + 14);
      y += 30;

      if (v.resumo) {
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        const lines = doc.splitTextToSize(v.resumo, pageWidth - marginX * 2);
        doc.text(lines, marginX, y);
        y += lines.length * 12 + 6;
      }

      if (v.itens.length) {
        autoTable(doc, {
          startY: y,
          margin: { left: marginX, right: marginX },
          head: [["Categoria", "Descrição"]],
          body: v.itens.map((i) => [catMeta[i.categoria]?.label ?? i.categoria, i.descricao]),
          styles: { fontSize: 9, cellPadding: 4 },
          headStyles: { fillColor: [124, 58, 237], textColor: 255 },
          columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: "auto" } },
          didDrawPage: () => {},
        });
        // @ts-expect-error autotable extends doc
        y = doc.lastAutoTable.finalY + 16;
      } else {
        y += 8;
      }

      if (idx === data.length - 1) {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Portal Pagadoria — documento gerado automaticamente.", marginX, 810);
      }
    });

    doc.save(`historico-versoes-portal-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
        <SidebarTrigger />
        <Link to="/" className="flex flex-1 items-center gap-2 hover:opacity-80 transition-opacity">
          <AppLogo area="header" className="h-6 w-auto shrink-0 sm:h-7" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-foreground">Histórico de Versões</h1>
            <p className="hidden truncate text-[10px] text-muted-foreground sm:block">Linha do tempo e novidades</p>
          </div>
        </Link>
        <div className="ml-auto">
          <HeaderActions />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card/50 overflow-hidden shadow-sm border border-border">
            <img src={logoPagadoria.url} alt="Pagadoria" className="h-6 w-6 object-contain" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Versão atual</p>
            <p className="text-lg font-semibold text-foreground">
              {isLoading ? "Carregando…" : versaoAtual ? `v${versaoAtual}` : "—"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar em versões, itens…"
              className="h-9 w-64 pl-8"
            />
          </div>
          <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="major">Major</SelectItem>
              <SelectItem value="minor">Minor</SelectItem>
              <SelectItem value="patch">Patch</SelectItem>
              <SelectItem value="hotfix">Hotfix</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={gerarPDF} disabled={isLoading || data.length === 0}>
            <Download className="mr-1 h-4 w-4" /> Baixar PDF completo
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando histórico…
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Não foi possível carregar o histórico.
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhuma versão encontrada com os filtros atuais.
        </div>
      )}

      <ol className="relative ml-3 space-y-4 border-l-2 border-border pl-6">
        {filtered.map((v) => (
          <li key={v.versao} className="relative">
            <span className={`absolute -left-[33px] top-2 grid h-5 w-5 place-items-center rounded-full border-2 ${
              v.versao === versaoAtual ? "border-violet-600 bg-violet-600" : "border-border bg-card"
            }`}>
              {v.versao === versaoAtual && <span className="h-1.5 w-1.5 rounded-full bg-card" />}
            </span>
            <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <header className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">v{v.versao} — {v.titulo}</h2>
                    {v.versao === versaoAtual && (
                      <Badge className="bg-violet-600 hover:bg-violet-600">Você está aqui</Badge>
                    )}
                    {v.destaque && v.versao !== versaoAtual && (
                      <Badge variant="outline">Destaque</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(v.lancada_em), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    {v.autor && ` • ${v.autor}`}
                  </p>
                </div>
                <Badge variant={tipoVariant[v.tipo]} className="uppercase">{v.tipo}</Badge>
              </header>

              {v.resumo && (
                <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">{v.resumo}</p>
              )}

              {v.itens.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {v.itens.map((it, i) => {
                    const meta = catMeta[it.categoria];
                    const Icon = meta?.Icon ?? Sparkles;
                    return (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta?.color ?? "text-muted-foreground"}`} />
                        <span>
                          <span className="mr-2 text-xs font-semibold uppercase text-muted-foreground">
                            {meta?.label ?? it.categoria}
                          </span>
                          {it.descricao}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          </li>
        ))}
      </ol>
      </div>
    </div>
  );
}
