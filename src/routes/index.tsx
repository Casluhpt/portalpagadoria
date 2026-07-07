import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Filter, Loader2, RotateCcw } from "lucide-react";
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
  LabelList,
} from "recharts";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import { fetchAllLancamentos, lancamentosQueryKey, type Lancamento } from "@/lib/lancamentos";
import logoAsset from "@/assets/profarma-logo.png.asset.json";

type Row = Lancamento;

const prettyIssuer = (v: string | null) => {
  if (!v) return v;
  const base = v.split(".")[0].toLowerCase();
  return base.charAt(0).toUpperCase() + base.slice(1);
};

const applyDisplay = (data: Lancamento[]): Row[] =>
  data.map((r) => ({ ...r, issuer: prettyIssuer(r.issuer) }));


const PIE_COLORS = ["#c084fc", "#a855f7", "#7e22ce", "#9333ea", "#d8b4fe", "#e9d5ff"];

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const monthKey = (iso: string) => iso.slice(0, 7);
const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  const names = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  return `${names[Number(m) - 1]}/${y.slice(2)}`;
};

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function uniqSorted<T>(arr: (T | null | undefined)[]): T[] {
  return Array.from(new Set(arr.filter((v): v is T => v != null && v !== ""))).sort(
    (a, b) => String(a).localeCompare(String(b), "pt-BR")
  );
}

function Dashboard() {
  const { data: raw, isLoading, error } = useQuery({
    queryKey: lancamentosQueryKey,
    queryFn: fetchAllLancamentos,
    staleTime: 30_000,
  });
  const rows = useMemo(() => applyDisplay(raw ?? []), [raw]);

  const allStatus = useMemo(() => uniqSorted(rows.map((r) => r.descStatus)), [rows]);
  const allEmpresas = useMemo(() => uniqSorted(rows.map((r) => r.Empresa)), [rows]);
  const allIssuers = useMemo(() => uniqSorted(rows.map((r) => r.issuer)), [rows]);
  const allActions = useMemo(() => uniqSorted(rows.map((r) => r.action)), [rows]);

  const dateBounds = useMemo(() => {
    const dates = rows.map((r) => r.dueDate).filter((d): d is string => !!d).sort();
    return { min: dates[0] ?? "", max: dates[dates.length - 1] ?? "" };
  }, [rows]);

  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [status, setStatus] = useState<string[]>([]);
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [issuers, setIssuers] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (r.dueDate) {
        if (dateFrom && r.dueDate < dateFrom) return false;
        if (dateTo && r.dueDate > dateTo) return false;
      }
      if (status.length && !status.includes(r.descStatus ?? "")) return false;
      if (empresas.length && !empresas.includes(r.Empresa ?? "")) return false;
      if (issuers.length && !issuers.includes(r.issuer ?? "")) return false;
      if (actions.length && !actions.includes(r.action ?? "")) return false;
      return true;
    });
  }, [rows, dateFrom, dateTo, status, empresas, issuers, actions]);

  const total = filtered.length;
  const valorTotal = filtered.reduce((s, r) => s + (r.grossAmount ?? 0), 0);

  const byMonth = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      if (!r.dueDate) continue;
      const k = monthKey(r.dueDate);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m, ([k, count]) => ({ key: k, label: monthLabel(k), count }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [filtered]);

  const byUser = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const k = r.issuer ?? "—";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value
    );
  }, [filtered]);

  const byModalidade = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const k = r.action ?? "—";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m, ([name, count]) => ({ name, count })).sort(
      (a, b) => b.count - a.count
    );
  }, [filtered]);

  const byEmpresa = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const k = r.Empresa ?? "—";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m, ([name, count]) => ({ name, count })).sort(
      (a, b) => b.count - a.count
    );
  }, [filtered]);

  const resetAll = () => {
    setDateFrom(dateBounds.min);
    setDateTo(dateBounds.max);
    setStatus([]);
    setEmpresas([]);
    setIssuers([]);
    setActions([]);
  };

  const activeFilterCount =
    (status.length ? 1 : 0) +
    (empresas.length ? 1 : 0) +
    (issuers.length ? 1 : 0) +
    (actions.length ? 1 : 0) +
    (dateFrom !== dateBounds.min || dateTo !== dateBounds.max ? 1 : 0);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div>
              <h1 className="text-sm font-semibold text-foreground">Painel BI</h1>
              <p className="text-xs text-muted-foreground">
                {total.toLocaleString("pt-BR")} lançamentos · {brl(valorTotal)}
              </p>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6">
            {/* PURPLE CANVAS */}
            <div
              className="relative overflow-hidden rounded-3xl p-5 lg:p-7 text-white shadow-[0_20px_60px_-20px_rgba(88,28,135,0.6)]"
              style={{
                background:
                  "linear-gradient(135deg, #4c1d95 0%, #6d28d9 45%, #7c3aed 100%)",
              }}
            >
              {/* Ambient glow */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />

              {/* Top row: logo + total geral + filters trigger */}
              <div className="relative grid grid-cols-1 items-center gap-4 lg:grid-cols-[auto_1fr_auto]">
                <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lg">
                  <img
                    src={logoAsset.url}
                    alt="Grupo Profarma 65 anos"
                    className="h-10 w-auto lg:h-12"
                  />
                </div>

                <div className="flex items-center justify-center">
                  <div className="rounded-2xl bg-white/10 px-8 py-3 text-center backdrop-blur ring-1 ring-white/15">
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-100">
                      Total Geral
                    </div>
                    <div className="mt-1 text-5xl font-bold text-white lg:text-6xl">
                      {total.toLocaleString("pt-BR")}
                    </div>
                    <div className="mt-1 text-sm text-violet-100/90">
                      {brl(valorTotal)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={resetAll}
                    className="bg-white/10 text-white hover:bg-white/20 border-white/20"
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" /> Limpar
                  </Button>
                </div>
              </div>

              {/* Filters row */}
              <div className="relative mt-5 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
                <div className="col-span-2 md:col-span-1">
                  <FilterLabel>De</FilterLabel>
                  <Input
                    type="date"
                    value={dateFrom}
                    min={dateBounds.min}
                    max={dateBounds.max}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-10 border-white/20 bg-white/10 text-sm text-white placeholder:text-white/60 [color-scheme:dark]"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <FilterLabel>Até</FilterLabel>
                  <Input
                    type="date"
                    value={dateTo}
                    min={dateBounds.min}
                    max={dateBounds.max}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-10 border-white/20 bg-white/10 text-sm text-white placeholder:text-white/60 [color-scheme:dark]"
                  />
                </div>
                <MultiSelect
                  label="Status"
                  options={allStatus}
                  value={status}
                  onChange={setStatus}
                />
                <MultiSelect
                  label="Colaboradores"
                  options={allIssuers}
                  value={issuers}
                  onChange={setIssuers}
                />
                <MultiSelect
                  label="Empresas"
                  options={allEmpresas}
                  value={empresas}
                  onChange={setEmpresas}
                />
                <MultiSelect
                  label="Lançamentos"
                  options={allActions}
                  value={actions}
                  onChange={setActions}
                />
              </div>

              {activeFilterCount > 0 && (
                <div className="relative mt-3 flex items-center gap-2 text-xs text-violet-100">
                  <Filter className="h-3.5 w-3.5" />
                  {activeFilterCount} filtro{activeFilterCount > 1 ? "s" : ""} ativo
                  {activeFilterCount > 1 ? "s" : ""}
                </div>
              )}

              {/* Charts grid */}
              <div className="relative mt-6 grid gap-4 lg:grid-cols-2">
                <PurpleCard title="Lançamentos por Mês">
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={byMonth} margin={{ top: 24, right: 8, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 14, fill: "rgba(255,255,255,0.95)", fontWeight: 600 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 13, fill: "rgba(255,255,255,0.85)", fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.06)" }} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#c084fc">
                        <LabelList
                          dataKey="count"
                          position="top"
                          fill="#fff"
                          fontSize={14}
                          fontWeight={600}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </PurpleCard>

                <PurpleCard title="Lançamentos por Usuários">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height={230}>
                        <PieChart>
                          <Pie
                            data={byUser}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={0}
                            outerRadius={90}
                            stroke="rgba(76, 29, 149, 0.6)"
                            strokeWidth={2}
                            label={({ percent }) =>
                              percent && percent > 0.03
                                ? `${(percent * 100).toFixed(1)}%`
                                : ""
                            }
                            labelLine={false}
                          >
                            {byUser.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<DarkTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-48 space-y-2 pr-2">
                      <div className="text-sm font-semibold uppercase tracking-wide text-violet-100">
                        Usuário
                      </div>
                      {byUser.map((u, i) => (
                        <div key={u.name} className="flex items-center gap-2 text-sm">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="flex-1 truncate text-white/90">{u.name}</span>
                          <span className="text-white/70">{u.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </PurpleCard>

                <PurpleCard title="Lançamentos por Modalidades">
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={byModalidade} margin={{ top: 24, right: 12, left: 0, bottom: 32 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 13, fill: "rgba(255,255,255,0.95)", fontWeight: 600 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                        tickLine={false}
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                        height={50}
                      />
                      <YAxis hide />
                      <Tooltip content={<DarkTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#e9d5ff"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#c084fc", stroke: "#fff", strokeWidth: 1 }}
                      >
                        <LabelList
                          dataKey="count"
                          position="top"
                          fill="#fff"
                          fontSize={14}
                          fontWeight={600}
                        />
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
                </PurpleCard>

                <PurpleCard title="Lançamentos por Empresas">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={byEmpresa} margin={{ top: 24, right: 8, left: 0, bottom: 32 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 13, fill: "rgba(255,255,255,0.95)", fontWeight: 600 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                        tickLine={false}
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                        height={50}
                      />
                      <YAxis hide />
                      <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.06)" }} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#a855f7">
                        <LabelList
                          dataKey="count"
                          position="top"
                          fill="#fff"
                          fontSize={14}
                          fontWeight={600}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </PurpleCard>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-violet-100">
      {children}
    </Label>
  );
}

function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string, checked: boolean) => {
    onChange(checked ? [...value, opt] : value.filter((v) => v !== opt));
  };
  const summary =
    value.length === 0
      ? "Todos"
      : value.length === 1
        ? value[0]
        : `${value.length} selecionados`;

  return (
    <div className="min-w-0">
      <FilterLabel>{label}</FilterLabel>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-10 w-full justify-between border-white/20 bg-white/10 px-3 text-left text-sm font-medium text-white hover:bg-white/20 hover:text-white"
          >
            <span className="truncate">{summary}</span>
            <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="start">
          <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs">
            <span className="font-medium">{label}</span>
            {value.length > 0 && (
              <button
                onClick={() => onChange([])}
                className="text-primary hover:underline"
              >
                Limpar
              </button>
            )}
          </div>
          <ScrollArea className="max-h-64">
            <div className="p-1">
              {options.map((opt) => {
                const checked = value.includes(opt);
                return (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) => toggle(opt, !!c)}
                    />
                    <span className="flex-1 truncate">{opt}</span>
                    {checked && <Check className="h-3.5 w-3.5 text-primary" />}
                  </label>
                );
              })}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function PurpleCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.06] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.4)] backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-base font-semibold text-white lg:text-lg">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: { name?: string } }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const name = label ?? p?.payload?.name ?? p?.name;
  return (
    <div className="rounded-lg border border-white/20 bg-[#2e1065] px-3 py-2 text-sm text-white shadow-xl">
      <div className="font-semibold">{name}</div>
      <div className="text-violet-200">
        {(p?.value ?? 0).toLocaleString("pt-BR")} lançamentos
      </div>
    </div>
  );
}
