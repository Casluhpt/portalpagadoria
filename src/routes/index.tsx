import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ArrowUpRight,
  Banknote,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  LineChart,
  ScrollText,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import profarmaLogo from "@/assets/profarma-logo.png.asset.json";
import { fetchAllLancamentos, lancamentosQueryKey } from "@/lib/lancamentos";
import { fetchAllProvisao, provisaoQueryKey } from "@/lib/provisao";

export const Route = createFileRoute("/")({
  component: PortalPage,
});

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const today = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => new Date().toISOString().slice(0, 7);

function PortalPage() {
  const { data: lanc = [] } = useQuery({
    queryKey: lancamentosQueryKey,
    queryFn: fetchAllLancamentos,
    staleTime: 60_000,
  });
  const { data: prov = [] } = useQuery({
    queryKey: provisaoQueryKey,
    queryFn: fetchAllProvisao,
    staleTime: 60_000,
  });

  const kpis = useMemo(() => {
    const mes = currentMonth();
    const doMes = lanc.filter((r) => (r.dueDate ?? "").startsWith(mes));
    const totalMes = doMes.reduce((s, r) => s + (Number(r.grossAmount) || 0), 0);
    const colaboradores = new Set(
      doMes.map((r) => (r.issuer || "").split(".")[0].toLowerCase()).filter(Boolean),
    ).size;
    const hoje = today();
    const provHoje = prov
      .filter((r) => r.data === hoje)
      .reduce((s, r) => s + (Number(r.valor) || 0), 0);
    const empresasProv = new Set(prov.filter((r) => r.data === hoje).map((r) => r.empresa)).size;
    return { totalMes, colaboradores, provHoje, empresasProv, totalLanc: lanc.length };
  }, [lanc, prov]);

  const modules: ModuleDef[] = [
    {
      key: "resultados",
      title: "Resultados Principais",
      subtitle: "Apresentação dos indicadores consolidados da Pagadoria.",
      objetivo: "Acompanhamento dos resultados finais da operação através de uma única base oficial.",
      base: "Base Principal",
      baseTo: "/base",
      to: "/principal",
      cta: "Visualizar Resultados",
      icon: BarChart3,
      accent: "from-violet-600 to-indigo-700",
      chip: "bg-violet-100 text-violet-800",
      bullets: [
        "Total pago no mês",
        "Total de colaboradores pagos",
        "Valor líquido processado",
        "Comparativo mensal e anual",
      ],
      updated: "hoje",
    },
    {
      key: "pagamentos",
      title: "Pagamentos Diversos",
      subtitle: "Gestão dos pagamentos diversos processados pela Pagadoria.",
      objetivo: "Importação, versionamento mensal e conciliação LG × Bankmanager × Itaú.",
      base: "Base de Pagamentos",
      baseTo: "/pagamentos",
      to: "/pagamentos",
      cta: "Acessar Pagamentos",
      icon: Banknote,
      accent: "from-emerald-600 to-teal-800",
      chip: "bg-emerald-100 text-emerald-800",
      bullets: [
        "Importação Excel/CSV",
        "Versionamento mensal",
        "Conciliação multi-fonte",
        "Aprovação e pagamento",
      ],
      updated: "hoje",
    },
    {
      key: "provisao",
      title: "Provisão Diária",
      subtitle: "Controle diário das provisões e evolução financeira.",
      objetivo: "Valores provisórios do dia e base utilizada para alimentação das informações.",
      base: "Base de Provisão",
      baseTo: "/provisao/base",
      to: "/provisao",
      cta: "Consultar Provisão",
      icon: Wallet,
      accent: "from-indigo-600 to-blue-800",
      chip: "bg-indigo-100 text-indigo-800",
      bullets: [
        "Provisão do dia",
        "Provisão acumulada",
        "Diferença previsto x realizado",
        "Tendência de fechamento",
      ],
      updated: "hoje",
    },
    {
      key: "conciliacao",
      title: "Conciliação Bancária",
      subtitle: "Validação dos pagamentos processados contra os retornos bancários.",
      objetivo: "Monitorar divergências e garantir que os pagamentos estejam conciliados.",
      base: "Base de Conciliação",
      baseTo: "/conciliacao",
      to: "/conciliacao",
      cta: "Iniciar Conciliação",
      icon: ShieldCheck,
      accent: "from-purple-700 to-fuchsia-800",
      chip: "bg-fuchsia-100 text-fuchsia-800",
      bullets: [
        "Total conciliado e pendente",
        "Divergências encontradas",
        "Status de fechamento",
        "Percentual de conciliação",
      ],
      updated: "diariamente",
    },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-50 via-slate-100 to-violet-50">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <img src={profarmaLogo.url} alt="Profarma" className="h-7" />
            <div className="ml-2 hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-semibold text-slate-800">Portal Pagadoria</span>
              <span className="text-[11px] text-slate-500">Central de inteligência financeira</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-1 text-xs text-slate-500 md:flex">
                <CalendarDays className="h-4 w-4" />
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <HeaderActions />
            </div>
          </header>

          <main className="flex-1 space-y-8 p-6 lg:p-8">
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-violet-800 to-purple-900 p-8 text-white shadow-xl">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-fuchsia-400/10 blur-3xl" />
              <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <Badge className="mb-3 bg-white/15 text-white hover:bg-white/20">
                    Portal Corporativo
                  </Badge>
                  <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Pagadoria</h1>
                  <p className="mt-2 text-base text-white/80 md:text-lg">
                    Central de inteligência da Pagadoria com foco em resultados, pagamentos,
                    provisões e conciliações financeiras.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="lg" className="bg-white text-indigo-900 hover:bg-white/90">
                    <Link to="/principal">
                      <LineChart className="mr-2 h-4 w-4" /> Dashboard Executivo
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/30 bg-transparent text-white hover:bg-white/10"
                  >
                    <Link to="/pagamentos">
                      <Banknote className="mr-2 h-4 w-4" /> Pagamentos Diversos
                    </Link>
                  </Button>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Total pago no mês"
                value={brl(kpis.totalMes)}
                hint={`${kpis.totalLanc} lançamentos na base`}
                icon={<TrendingUp className="h-5 w-5" />}
                tone="violet"
              />
              <KpiCard
                label="Colaboradores pagos"
                value={kpis.colaboradores.toLocaleString("pt-BR")}
                hint="mês corrente"
                icon={<Users className="h-5 w-5" />}
                tone="indigo"
              />
              <KpiCard
                label="Provisão do dia"
                value={brl(kpis.provHoje)}
                hint={`${kpis.empresasProv} empresas hoje`}
                icon={<Wallet className="h-5 w-5" />}
                tone="blue"
              />
              <KpiCard
                label="Conciliação"
                value="—"
                hint="aguardando integração"
                icon={<CheckCircle2 className="h-5 w-5" />}
                tone="slate"
              />
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              {modules.map((m) => (
                <ModuleCard key={m.key} m={m} />
              ))}
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone: "violet" | "indigo" | "blue" | "slate";
}) {
  const tones: Record<string, string> = {
    violet: "from-violet-500 to-violet-700",
    indigo: "from-indigo-500 to-indigo-700",
    blue: "from-blue-600 to-blue-800",
    slate: "from-slate-600 to-slate-800",
  };
  return (
    <Card className="border-slate-200 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md ${tones[tone]}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-0.5 truncate text-2xl font-bold text-slate-900">{value}</p>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

type ModuleDef = {
  key: string;
  title: string;
  subtitle: string;
  objetivo: string;
  base: string;
  baseTo: string;
  to: string;
  cta: string;
  icon: typeof BarChart3;
  accent: string;
  chip: string;
  bullets: readonly string[];
  updated: string;
};

function ModuleCard({ m }: { m: ModuleDef }) {
  const Icon = m.icon;
  return (
    <Card className="group relative overflow-hidden border-slate-200 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl">
      <div className={`h-1.5 w-full bg-gradient-to-r ${m.accent}`} />
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md ${m.accent}`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{m.title}</h3>
              <p className="text-xs text-slate-500">{m.subtitle}</p>
            </div>
          </div>
          <Badge className={`shrink-0 ${m.chip} hover:${m.chip}`}>{m.base}</Badge>
        </div>

        <p className="text-sm text-slate-600">{m.objetivo}</p>

        <ul className="grid grid-cols-1 gap-1.5 text-sm text-slate-700 sm:grid-cols-2">
          {m.bullets.map((b) => (
            <li key={b} className="flex items-start gap-1.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
              {b}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <ScrollText className="h-3.5 w-3.5" /> Base: <b>{m.base}</b>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Atualizado: {m.updated}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button asChild className={`bg-gradient-to-r text-white shadow ${m.accent}`}>
            <Link to={m.to}>
              {m.cta} <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={m.baseTo}>Ver base</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
