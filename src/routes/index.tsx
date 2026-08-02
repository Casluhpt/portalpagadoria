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
  Sparkles,
  ChevronLeft,
  ChevronRight,

  Wrench,
  Bug,
  Users,
  Wallet,
  Landmark,
  FileSpreadsheet,
  Search,
} from "lucide-react";


import { AppSidebar } from "@/components/app-sidebar";
import { AppLogo } from "@/components/app-logo";
import { HeaderActions } from "@/components/header-actions";
import { useRoles } from "@/hooks/use-roles";
import { useSession } from "@/hooks/use-session";
import logoPagadoria from "@/assets/logo-pagadoria.png.asset.json";
import { GlobalSearch } from "@/components/global-search";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import profarmaLogo from "@/assets/profarma-logo.png.asset.json";
import { fetchAllLancamentos, lancamentosQueryKey } from "@/lib/lancamentos";
import { fetchAllProvisao, provisaoQueryKey } from "@/lib/provisao";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";


export const Route = createFileRoute("/")({
  component: PortalPage,
});

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const today = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => new Date().toISOString().slice(0, 7);

function PortalPage() {
  const { isAdmin } = useRoles();
  const { user } = useSession();
  const { data: lanc = [] } = useQuery({
    queryKey: lancamentosQueryKey,
    queryFn: fetchAllLancamentos,
    enabled: !!user,
    staleTime: 60_000,
  });
  const { data: prov = [] } = useQuery({
    queryKey: provisaoQueryKey,
    queryFn: fetchAllProvisao,
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: versoes = [] } = useQuery({
    queryKey: ["app_versions", "timeline"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_versions")
        .select("versao, lancada_em, tipo, titulo, resumo, itens, destaque")
        .order("lancada_em", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const latest = versoes[0];
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("timeline_dismissed_versions");
      if (raw) setDismissed(JSON.parse(raw));
    } catch {}
  }, []);
  const dismissVersion = (v: string) => {
    const next = Array.from(new Set([...dismissed, v]));
    setDismissed(next);
    try {
      localStorage.setItem("timeline_dismissed_versions", JSON.stringify(next));
    } catch {}
  };
  const visibleVersoes = versoes.filter((v) => !dismissed.includes(v.versao));

  const [carouselIdx, setCarouselIdx] = useState(0);
  const [slideKey, setSlideKey] = useState(0);
  useEffect(() => {
    if (carouselIdx >= visibleVersoes.length) setCarouselIdx(0);
  }, [visibleVersoes.length, carouselIdx]);
  useEffect(() => {
    if (visibleVersoes.length <= 1) return;
    const t = setInterval(() => {
      setCarouselIdx((i) => {
        const next = (i + 1) % visibleVersoes.length;
        return next;
      });
      setSlideKey((k) => k + 1);
    }, 5000);
    return () => clearInterval(t);
  }, [visibleVersoes.length]);
  const goTo = (i: number) => {
    if (visibleVersoes.length === 0) return;
    const n = ((i % visibleVersoes.length) + visibleVersoes.length) % visibleVersoes.length;
    setCarouselIdx(n);
    setSlideKey((k) => k + 1);
  };



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
      base: "[anexo]",
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
      base: "[anexo]",
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
      base: "[anexo]",
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
      base: "[anexo]",
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
    {
      key: "aprovacao",
      title: "Processo de Aprovação",
      subtitle: "Fluxo de aprovações dos processos da Pagadoria.",
      objetivo: "Controle das etapas de aprovação, responsáveis e status de cada processo.",
      base: "Base de Aprovações",
      baseTo: "/aprovacao",
      to: "/aprovacao",
      cta: "Acessar Aprovações",
      icon: Landmark,
      accent: "from-sky-600 to-cyan-800",
      chip: "bg-sky-100 text-sky-800",
      bullets: [
        "Solicitações pendentes",
        "Aprovadores responsáveis",
        "Histórico de decisões",
        "Status por etapa",
      ],
      updated: "em breve",
    },
    {
      key: "esocial",
      title: "Controle E-Social",
      subtitle: "Acompanhamento dos eventos e envios ao E-Social.",
      objetivo: "Monitorar eventos, prazos e status de transmissão ao E-Social.",
      base: "[anexo]",
      baseTo: "/esocial",
      to: "/esocial",
      cta: "Acessar E-Social",
      icon: FileSpreadsheet,
      accent: "from-amber-600 to-orange-700",
      chip: "bg-amber-100 text-amber-800",
      bullets: [
        "Eventos periódicos e não periódicos",
        "Status de transmissão",
        "Controle de prazos",
        "Retornos e ocorrências",
      ],
      updated: "em breve",
    },
    {
      key: "despesas-fixas",
      title: "Despesas Fixas",
      subtitle: "Lançamentos mensais de PJs, Pensão, Penhora e Fornecedores.",
      objetivo: "Base de valores lançados de janeiro a dezembro por categoria de despesa fixa.",
      base: "Base Despesas Fixas 2026",
      baseTo: "/despesas-fixas",
      to: "/despesas-fixas",
      cta: "Acessar Despesas Fixas",
      icon: Wallet,
      accent: "from-emerald-600 to-teal-800",
      chip: "bg-emerald-100 text-emerald-800",
      bullets: [
        "PJs, Pensão, Penhora e Fornecedores",
        "Valores por mês (Jan–Dez)",
        "Totais por categoria e mês",
        "Edição inline e histórico",
      ],
      updated: "mensalmente",
    },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F8FAFC] dark:bg-background transition-colors duration-300">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur">
            <SidebarTrigger />
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <AppLogo className="h-6 w-auto shrink-0 sm:h-7" />
              <div className="ml-2 hidden flex-col leading-tight sm:flex">
                <span className="text-sm font-semibold text-foreground">Portal Pagadoria</span>
                <span className="text-[10px] text-muted-foreground">Central de inteligência financeira</span>
              </div>
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
                <CalendarDays className="h-4 w-4" />
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <div className="hidden h-8 w-[1px] bg-muted md:block" />
              <HeaderActions />
            </div>
          </header>

          <main className="flex-1 space-y-12 p-6 lg:p-10 max-w-[1600px] mx-auto w-full">

            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-violet-800 to-purple-900 p-8 text-white shadow-xl">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-fuchsia-400/10 blur-3xl" />
              <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <Badge className="mb-3 bg-white/15 text-white hover:bg-white/20">
                    Portal Corporativo
                  </Badge>
                  <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Pagadoria</h1>
                  <p className="mt-2 text-base text-white/80 md:text-lg max-w-xl">
                    Central de inteligência da Pagadoria com foco em resultados, pagamentos e provisões, garantindo a governança e a fluidez de seus processos financeiros.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="lg" className="bg-white text-indigo-900 hover:bg-white/90 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 dark:border dark:border-white/20 shadow-lg">
                    <Link to="/principal">
                      <LineChart className="mr-2 h-4 w-4" /> Resultados Principais
                    </Link>
                  </Button>
                </div>
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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

            {visibleVersoes.length > 0 && (
              <section className="rounded-2xl border border-violet-200 bg-card/90 p-6 shadow-sm backdrop-blur">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card/50 overflow-hidden shadow-sm border border-border">
                      <AppLogo className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Novidades do Portal</h2>
                      <p className="text-xs text-muted-foreground">
                        Acompanhe as melhorias mais recentes. Feche uma atualização quando não quiser mais vê-la.
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button asChild variant="outline" size="sm">
                      <Link to="/historico">Ver histórico completo</Link>
                    </Button>
                  )}
                </div>

                <div className="relative overflow-hidden">
                  {(() => {
                    const v = visibleVersoes[carouselIdx];
                    if (!v) return null;
                    const isLatest = latest?.versao === v.versao;
                    const itens = Array.isArray(v.itens)
                      ? (v.itens as Array<{ categoria: string; descricao: string }>)
                      : [];
                    return (
                      <div key={`${v.versao}-${slideKey}`} className="animate-slide-in-right-slow">
                        <Card className={isLatest ? "border-violet-300 shadow-md" : "border-border"}>
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge className="bg-violet-100 text-violet-800 hover:bg-violet-100">
                                    v{v.versao}
                                  </Badge>
                                  {isLatest && (
                                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                                      Nova versão
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(v.lancada_em).toLocaleDateString("pt-BR", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                                <h3 className="mt-1 text-base font-semibold text-foreground">
                                  {v.titulo}
                                </h3>
                                {v.resumo && (
                                  <p className="mt-0.5 text-sm text-muted-foreground">{v.resumo}</p>
                                )}
                                {itens.length > 0 && (
                                  <ul className="mt-2 space-y-1 text-sm text-foreground">
                                    {itens.slice(0, 4).map((it, i) => {
                                      const Icon =
                                        it.categoria === "novo"
                                          ? Sparkles
                                          : it.categoria === "correção" || it.categoria === "correcao"
                                            ? Bug
                                            : it.categoria === "seguranca" || it.categoria === "segurança"
                                              ? ShieldCheck
                                              : Wrench;
                                      return (
                                        <li key={i} className="flex items-start gap-2">
                                          <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" />
                                          <span>{it.descricao}</span>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => dismissVersion(v.versao)}
                                aria-label="Fechar atualização"
                                className="shrink-0 text-muted-foreground hover:text-foreground"
                              >
                                ×
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()}
                </div>

                {visibleVersoes.length > 1 && (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => goTo(carouselIdx - 1)}
                      aria-label="Anterior"
                      className="h-8 w-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1.5">
                      {visibleVersoes.map((v, i) => (
                        <button
                          key={v.versao}
                          onClick={() => goTo(i)}
                          aria-label={`Ir para v${v.versao}`}
                          className={`h-2 rounded-full transition-all ${
                            i === carouselIdx ? "w-6 bg-violet-600" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60"
                          }`}
                        />
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => goTo(carouselIdx + 1)}
                      aria-label="Próximo"
                      className="h-8 w-8"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </section>
            )}




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
    <Card className="border-border shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md ${tones[tone]}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 truncate text-2xl font-bold text-foreground">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
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
    <Card className="group relative overflow-hidden border-border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl">
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
              <h3 className="text-lg font-bold text-foreground">{m.title}</h3>
              <p className="text-xs text-muted-foreground">{m.subtitle}</p>
            </div>
          </div>
          <Badge className={`shrink-0 ${m.chip} hover:${m.chip}`}>{m.base}</Badge>
        </div>

        <p className="text-sm text-muted-foreground">{m.objetivo}</p>

        <ul className="grid grid-cols-1 gap-1.5 text-sm text-foreground sm:grid-cols-2">
          {m.bullets.map((b) => (
            <li key={b} className="flex items-start gap-1.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
              {b}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
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
