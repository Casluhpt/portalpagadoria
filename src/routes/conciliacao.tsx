import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Percent,
  Search,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { fetchPagamentos, pagamentosQueryKey } from "@/lib/pagamentos";
import { fetchAllProvisao, provisaoQueryKey } from "@/lib/provisao";

export const Route = createFileRoute("/conciliacao")({
  component: ConciliacaoPage,
});

type Lado = {
  data: string | null;
  empresa: string | null;
  banco: string | null;
  valor: number | null;
};

type Linha = {
  key: string;
  data: string | null;
  empresa: string | null;
  banco: string | null;
  valorPag: number | null;
  valorProv: number | null;
  status: "match" | "so_pagamento" | "so_provisao" | "divergente";
};

const brl = (n: number | null | undefined) =>
  n == null
    ? "—"
    : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const norm = (s: string | null | undefined) =>
  (s ?? "").toString().trim().toUpperCase();

// tolerância de 1 centavo para agrupar valores
const roundCents = (v: number | null | undefined) =>
  v == null ? "" : String(Math.round(v * 100));

const groupKey = (r: Lado) =>
  [r.data ?? "", norm(r.empresa), norm(r.banco), roundCents(r.valor)].join("|");

const partialKey = (r: Lado) =>
  [r.data ?? "", norm(r.empresa), norm(r.banco)].join("|");

function ConciliacaoPage() {
  const { data: pagamentos = [], isLoading: lp } = useQuery({
    queryKey: pagamentosQueryKey,
    queryFn: fetchPagamentos,
    staleTime: 30_000,
  });
  const { data: provisao = [], isLoading: lv } = useQuery({
    queryKey: provisaoQueryKey,
    queryFn: fetchAllProvisao,
    staleTime: 30_000,
  });

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("todos");

  const linhas = useMemo<Linha[]>(() => {
    const pag: Lado[] = pagamentos
      .map((p) => ({
        data: p.data_credito,
        empresa: p.empresa,
        banco: p.banco,
        valor: p.valor_lg,
      }))
      .filter((r) => r.data || r.empresa || r.banco || r.valor != null);

    const prov: Lado[] = provisao.map((p) => ({
      data: p.data,
      empresa: p.empresa,
      banco: p.banco,
      valor: p.valor,
    }));

    // Agrupar por chave completa (soma valores idênticos)
    const pagMap = new Map<string, { total: number; sample: Lado; count: number }>();
    for (const r of pag) {
      const k = groupKey(r);
      const cur = pagMap.get(k) ?? { total: 0, sample: r, count: 0 };
      cur.total += r.valor ?? 0;
      cur.count += 1;
      pagMap.set(k, cur);
    }
    const provMap = new Map<string, { total: number; sample: Lado; count: number }>();
    for (const r of prov) {
      const k = groupKey(r);
      const cur = provMap.get(k) ?? { total: 0, sample: r, count: 0 };
      cur.total += r.valor ?? 0;
      cur.count += 1;
      provMap.set(k, cur);
    }

    // Também agrupar por chave parcial (data+empresa+banco) para detectar
    // divergências de valor.
    const pagPartial = new Map<string, number>();
    for (const r of pag) {
      const k = partialKey(r);
      pagPartial.set(k, (pagPartial.get(k) ?? 0) + (r.valor ?? 0));
    }
    const provPartial = new Map<string, number>();
    for (const r of prov) {
      const k = partialKey(r);
      provPartial.set(k, (provPartial.get(k) ?? 0) + (r.valor ?? 0));
    }

    const out: Linha[] = [];
    const usedPartial = new Set<string>();

    // Match exato
    for (const [k, p] of pagMap) {
      if (provMap.has(k)) {
        out.push({
          key: "M|" + k,
          data: p.sample.data,
          empresa: p.sample.empresa,
          banco: p.sample.banco,
          valorPag: p.total,
          valorProv: provMap.get(k)!.total,
          status: "match",
        });
        usedPartial.add(partialKey(p.sample));
      }
    }

    // Só em pagamentos (sem match exato)
    for (const [k, p] of pagMap) {
      if (provMap.has(k)) continue;
      const pk = partialKey(p.sample);
      const provTotal = provPartial.get(pk);
      if (provTotal != null && !usedPartial.has(pk)) {
        // Divergente: mesma data/empresa/banco, valor diferente
        out.push({
          key: "D|" + pk,
          data: p.sample.data,
          empresa: p.sample.empresa,
          banco: p.sample.banco,
          valorPag: pagPartial.get(pk) ?? p.total,
          valorProv: provTotal,
          status: "divergente",
        });
        usedPartial.add(pk);
      } else if (!usedPartial.has(pk)) {
        out.push({
          key: "P|" + k,
          data: p.sample.data,
          empresa: p.sample.empresa,
          banco: p.sample.banco,
          valorPag: p.total,
          valorProv: null,
          status: "so_pagamento",
        });
      }
    }

    // Só em provisão (sem match exato e sem divergência já registrada)
    for (const [k, p] of provMap) {
      if (pagMap.has(k)) continue;
      const pk = partialKey(p.sample);
      if (usedPartial.has(pk)) continue;
      out.push({
        key: "V|" + k,
        data: p.sample.data,
        empresa: p.sample.empresa,
        banco: p.sample.banco,
        valorPag: null,
        valorProv: p.total,
        status: "so_provisao",
      });
    }

    // Ordena por data desc
    out.sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
    return out;
  }, [pagamentos, provisao]);

  const kpis = useMemo(() => {
    const total = linhas.length || 0;
    const conc = linhas.filter((l) => l.status === "match").length;
    const div = linhas.filter((l) => l.status === "divergente").length;
    const pend = linhas.filter(
      (l) => l.status === "so_pagamento" || l.status === "so_provisao",
    ).length;
    const pct = total > 0 ? Math.round((conc / total) * 100) : 0;
    return { conc, pend, div, pct };
  }, [linhas]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return linhas.filter((l) => {
      if (tab === "match" && l.status !== "match") return false;
      if (tab === "divergente" && l.status !== "divergente") return false;
      if (tab === "so_pagamento" && l.status !== "so_pagamento") return false;
      if (tab === "so_provisao" && l.status !== "so_provisao") return false;
      if (!q) return true;
      return [l.data, l.empresa, l.banco, brl(l.valorPag), brl(l.valorProv)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [linhas, search, tab]);

  const exportXlsx = () => {
    const rows = filtered.map((l) => ({
      Data: l.data ?? "",
      Empresa: l.empresa ?? "",
      Banco: l.banco ?? "",
      "Valor Pagamentos": l.valorPag ?? "",
      "Valor Provisão": l.valorProv ?? "",
      Diferença:
        l.valorPag != null && l.valorProv != null
          ? l.valorPag - l.valorProv
          : "",
      Status:
        l.status === "match"
          ? "Conciliado"
          : l.status === "divergente"
            ? "Divergente"
            : l.status === "so_pagamento"
              ? "Só em Pagamentos"
              : "Só em Provisão",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Conciliação");
    XLSX.writeFile(
      wb,
      `conciliacao-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const loading = lp || lv;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-white/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <ArrowLeft className="mr-1 h-4 w-4" /> Portal
              </Link>
            </Button>
            <h1 className="ml-2 font-semibold text-slate-800">
              Conciliação Bancária
            </h1>
          </header>
          <main className="flex-1 space-y-6 p-6">
            <Card className="border-slate-200">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-purple-700 to-fuchsia-800 text-white shadow">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Pagamentos Diversos × Base de Provisão
                  </h2>
                  <p className="text-sm text-slate-600">
                    Cruzamento automático por{" "}
                    <strong>Data de Crédito, Empresa, Banco e Valor</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Conciliados"
                value={kpis.conc.toString()}
                icon={CheckCircle2}
                tone="text-emerald-600"
              />
              <KpiCard
                label="Pendentes"
                value={kpis.pend.toString()}
                icon={AlertTriangle}
                tone="text-amber-600"
              />
              <KpiCard
                label="Divergências"
                value={kpis.div.toString()}
                icon={AlertTriangle}
                tone="text-rose-600"
              />
              <KpiCard
                label="% Conciliação"
                value={`${kpis.pct}%`}
                icon={Percent}
                tone="text-violet-600"
              />
            </div>

            <Card className="border-slate-200">
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Tabs value={tab} onValueChange={setTab} className="w-auto">
                    <TabsList>
                      <TabsTrigger value="todos">Todos</TabsTrigger>
                      <TabsTrigger value="match">Conciliados</TabsTrigger>
                      <TabsTrigger value="divergente">Divergentes</TabsTrigger>
                      <TabsTrigger value="so_pagamento">
                        Só Pagamentos
                      </TabsTrigger>
                      <TabsTrigger value="so_provisao">
                        Só Provisão
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
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
                    onClick={exportXlsx}
                    className="gap-1"
                    disabled={filtered.length === 0}
                  >
                    <Download className="h-4 w-4" /> Exportar
                  </Button>
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                  <TabsContent value={tab} className="mt-0">
                    <div className="overflow-auto rounded-lg border border-border">
                      <table className="min-w-full border-collapse text-sm">
                        <thead className="bg-muted/60">
                          <tr>
                            <Th>Data</Th>
                            <Th>Empresa</Th>
                            <Th>Banco</Th>
                            <Th className="text-right">Valor Pagamentos</Th>
                            <Th className="text-right">Valor Provisão</Th>
                            <Th className="text-right">Diferença</Th>
                            <Th>Status</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading && (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-4 py-10 text-center text-muted-foreground"
                              >
                                Carregando…
                              </td>
                            </tr>
                          )}
                          {!loading && filtered.length === 0 && (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-4 py-10 text-center text-muted-foreground"
                              >
                                Nenhum registro para exibir.
                              </td>
                            </tr>
                          )}
                          {filtered.map((l) => {
                            const diff =
                              l.valorPag != null && l.valorProv != null
                                ? l.valorPag - l.valorProv
                                : null;
                            return (
                              <tr
                                key={l.key}
                                className="border-b border-border hover:bg-muted/30"
                              >
                                <Td>
                                  {l.data
                                    ? new Date(
                                        l.data + "T00:00:00",
                                      ).toLocaleDateString("pt-BR")
                                    : "—"}
                                </Td>
                                <Td>{l.empresa ?? "—"}</Td>
                                <Td>{l.banco ?? "—"}</Td>
                                <Td className="text-right tabular-nums">
                                  {brl(l.valorPag)}
                                </Td>
                                <Td className="text-right tabular-nums">
                                  {brl(l.valorProv)}
                                </Td>
                                <Td
                                  className={
                                    "text-right tabular-nums " +
                                    (diff != null && Math.abs(diff) >= 0.01
                                      ? "font-semibold text-rose-600"
                                      : "text-muted-foreground")
                                  }
                                >
                                  {diff == null ? "—" : brl(diff)}
                                </Td>
                                <Td>
                                  <StatusBadge status={l.status} />
                                </Td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={
        "border-b border-border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground " +
        className
      }
    >
      {children}
    </th>
  );
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={"px-3 py-2 text-slate-800 " + className}>{children}</td>;
}

function StatusBadge({ status }: { status: Linha["status"] }) {
  if (status === "match")
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
        Conciliado
      </Badge>
    );
  if (status === "divergente")
    return <Badge variant="destructive">Divergente</Badge>;
  if (status === "so_pagamento")
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
        Só em Pagamentos
      </Badge>
    );
  return (
    <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">
      Só em Provisão
    </Badge>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <Card className="border-slate-200">
      <CardContent className="flex items-center gap-3 p-5">
        <Icon className={`h-8 w-8 ${tone}`} />
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
