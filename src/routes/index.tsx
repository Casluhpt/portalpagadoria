import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  DollarSign,
  FileText,
  Building2,
  Truck,
  Search,
  Plus,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import baseData from "@/data/base-bi.json";

type Row = {
  prePedido: number | null;
  issuer: string | null;
  supplier: string | null;
  invoiceNumber: string | null;
  accountGroup: string | number | null;
  center: string | number | null;
  company: number | null;
  dueDate: string | null;
  grossAmount: number | null;
  registerDate: string | null;
  descStatus: string | null;
  log: string | null;
  text: string | null;
  action: string | null;
  Empresa: string | null;
};

const rows = baseData as Row[];

const CHART_COLORS = [
  "oklch(0.55 0.22 295)",
  "oklch(0.7 0.18 320)",
  "oklch(0.65 0.18 265)",
  "oklch(0.75 0.15 340)",
  "oklch(0.6 0.2 275)",
  "oklch(0.8 0.14 310)",
];

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const brlFull = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const monthLabel = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
};

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const [search, setSearch] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const empresas = useMemo(
    () => Array.from(new Set(rows.map((r) => r.Empresa).filter(Boolean) as string[])).sort(),
    []
  );
  const statuses = useMemo(
    () => Array.from(new Set(rows.map((r) => r.descStatus).filter(Boolean) as string[])).sort(),
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (empresaFilter !== "all" && r.Empresa !== empresaFilter) return false;
      if (statusFilter !== "all" && r.descStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        (r.supplier ?? "").toLowerCase().includes(q) ||
        (r.issuer ?? "").toLowerCase().includes(q) ||
        String(r.prePedido ?? "").includes(q)
      );
    });
  }, [search, empresaFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = filtered.reduce((s, r) => s + (r.grossAmount ?? 0), 0);
    const pedidos = new Set(filtered.map((r) => r.prePedido)).size;
    const empresasCount = new Set(filtered.map((r) => r.Empresa)).size;
    const fornecedores = new Set(filtered.map((r) => r.supplier)).size;
    return { total, pedidos, empresasCount, fornecedores, linhas: filtered.length };
  }, [filtered]);

  const byEmpresa = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const k = r.Empresa ?? "—";
      m.set(k, (m.get(k) ?? 0) + (r.grossAmount ?? 0));
    }
    return Array.from(m, ([name, valor]) => ({ name, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);
  }, [filtered]);

  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const k = r.descStatus ?? "—";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value
    );
  }, [filtered]);

  const byMonth = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      if (!r.dueDate) continue;
      const key = r.dueDate.slice(0, 7);
      m.set(key, (m.get(key) ?? 0) + (r.grossAmount ?? 0));
    }
    return Array.from(m, ([key, valor]) => ({ key, label: monthLabel(key + "-01"), valor }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [filtered]);

  const topFornecedores = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const k = r.supplier ?? "—";
      m.set(k, (m.get(k) ?? 0) + (r.grossAmount ?? 0));
    }
    return Array.from(m, ([name, valor]) => ({ name, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [filtered]);

  const recent = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => (b.registerDate ?? "").localeCompare(a.registerDate ?? ""))
        .slice(0, 15),
    [filtered]
  );

  const statusVariant = (s: string | null) => {
    if (s === "Finalizado") return "bg-primary/15 text-primary border-primary/20";
    if (s === "Processando...") return "bg-accent text-accent-foreground border-accent";
    if (s?.startsWith("Aprovador")) return "bg-secondary text-secondary-foreground border-secondary";
    if (s?.startsWith("Recusado")) return "bg-destructive/15 text-destructive border-destructive/20";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex flex-1 items-center justify-between gap-3">
              <div>
                <h1 className="text-sm font-semibold text-foreground">Painel BI</h1>
                <p className="text-xs text-muted-foreground">
                  {stats.linhas.toLocaleString("pt-BR")} lançamentos filtrados
                </p>
              </div>
              <Button
                size="sm"
                className="bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-90"
              >
                <Plus className="mr-1 h-4 w-4" /> Novo
              </Button>
            </div>
          </header>

          <main className="flex-1 space-y-6 p-6">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-[image:var(--gradient-primary)] p-6 text-primary-foreground shadow-[var(--shadow-elegant)]">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
              <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <Badge className="bg-white/20 text-primary-foreground hover:bg-white/25">
                    Base BI
                  </Badge>
                  <h2 className="mt-3 text-2xl font-semibold">Visão consolidada de pré-pedidos</h2>
                  <p className="mt-1 max-w-xl text-sm text-primary-foreground/85">
                    Acompanhe valores, status e fornecedores em todas as empresas do grupo.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wide text-primary-foreground/75">
                    Valor total filtrado
                  </div>
                  <div className="text-3xl font-semibold">{brl(stats.total)}</div>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por fornecedor, emissor ou pré-pedido..."
                  className="pl-9"
                />
              </div>
              <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {empresas.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stats */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Valor total" value={brl(stats.total)} icon={DollarSign} />
              <StatCard label="Pré-pedidos" value={stats.pedidos.toLocaleString("pt-BR")} icon={FileText} />
              <StatCard label="Empresas" value={String(stats.empresasCount)} icon={Building2} />
              <StatCard label="Fornecedores" value={String(stats.fornecedores)} icon={Truck} />
            </section>

            {/* Charts row */}
            <section className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">Valor por empresa</CardTitle>
                  <CardDescription>Top empresas por valor bruto</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={byEmpresa} margin={{ left: 8, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                      <YAxis
                        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                        tickFormatter={(v) => brl(v as number).replace("R$", "")}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          color: "var(--popover-foreground)",
                        }}
                        formatter={(v) => brlFull(v as number)}
                      />
                      <Bar dataKey="valor" radius={[8, 8, 0, 0]} fill="oklch(0.55 0.22 295)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">Status</CardTitle>
                  <CardDescription>Distribuição de lançamentos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={byStatus}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                      >
                        {byStatus.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          color: "var(--popover-foreground)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-1.5">
                    {byStatus.map((s, i) => (
                      <div key={s.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                          <span className="text-foreground">{s.name}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {s.value.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Second row */}
            <section className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">Evolução por vencimento</CardTitle>
                  <CardDescription>Soma do valor bruto por mês</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={byMonth} margin={{ left: 8, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                      <YAxis
                        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                        tickFormatter={(v) => brl(v as number).replace("R$", "")}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          color: "var(--popover-foreground)",
                        }}
                        formatter={(v) => brlFull(v as number)}
                      />
                      <Line
                        type="monotone"
                        dataKey="valor"
                        stroke="oklch(0.55 0.22 295)"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "oklch(0.55 0.22 295)" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">Top fornecedores</CardTitle>
                  <CardDescription>Por valor bruto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topFornecedores.map((f, i) => {
                    const max = topFornecedores[0]?.valor || 1;
                    const pct = (f.valor / max) * 100;
                    return (
                      <div key={f.name} className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate font-medium text-foreground" title={f.name}>
                            {i + 1}. {f.name}
                          </span>
                          <span className="text-muted-foreground">{brl(f.valor)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-[image:var(--gradient-primary)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </section>

            {/* Table */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Lançamentos recentes</CardTitle>
                <CardDescription>15 registros mais recentes conforme os filtros</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pré-pedido</TableHead>
                      <TableHead>Emissor</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{r.prePedido}</TableCell>
                        <TableCell className="text-xs">{r.issuer}</TableCell>
                        <TableCell className="max-w-xs truncate text-xs" title={r.supplier ?? ""}>
                          {r.supplier}
                        </TableCell>
                        <TableCell className="text-xs">{r.Empresa}</TableCell>
                        <TableCell className="text-xs">
                          {r.dueDate ? new Date(r.dueDate).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium">
                          {brl(r.grossAmount ?? 0)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusVariant(r.descStatus)}
                          >
                            {r.descStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border/60 shadow-sm transition hover:shadow-[var(--shadow-elegant)]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wide">
          {label}
        </CardDescription>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}
