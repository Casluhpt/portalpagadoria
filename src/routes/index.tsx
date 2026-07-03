import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, ShoppingBag, Activity, Plus } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const stats = [
  { label: "Receita", value: "R$ 0,00", change: "+0%", trend: "up", icon: DollarSign },
  { label: "Clientes", value: "0", change: "+0%", trend: "up", icon: Users },
  { label: "Pedidos", value: "0", change: "0%", trend: "up", icon: ShoppingBag },
  { label: "Sessões", value: "0", change: "0%", trend: "down", icon: Activity },
];

function Dashboard() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex flex-1 items-center justify-between">
              <div>
                <h1 className="text-sm font-semibold text-foreground">Visão geral</h1>
                <p className="text-xs text-muted-foreground">Bem-vindo de volta ao seu painel</p>
              </div>
              <Button size="sm" className="bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-90">
                <Plus className="mr-1 h-4 w-4" /> Novo
              </Button>
            </div>
          </header>

          <main className="flex-1 space-y-6 p-6">
            {/* Hero card */}
            <div className="relative overflow-hidden rounded-2xl bg-[image:var(--gradient-primary)] p-6 text-primary-foreground shadow-[var(--shadow-elegant)]">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
              <div className="relative">
                <Badge className="bg-white/20 text-primary-foreground hover:bg-white/25">Painel base</Badge>
                <h2 className="mt-3 text-2xl font-semibold">Comece adicionando suas informações</h2>
                <p className="mt-1 max-w-xl text-sm text-primary-foreground/85">
                  Essa é a estrutura do seu dashboard. Substitua os dados de exemplo pelos seus conteúdos reais quando estiver pronto.
                </p>
              </div>
            </div>

            {/* Stats grid */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((s) => {
                const Icon = s.icon;
                const TrendIcon = s.trend === "up" ? ArrowUpRight : ArrowDownRight;
                return (
                  <Card key={s.label} className="border-border/60 shadow-sm transition hover:shadow-[var(--shadow-elegant)]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardDescription className="text-xs font-medium uppercase tracking-wide">{s.label}</CardDescription>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold text-foreground">{s.value}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendIcon className={`h-3.5 w-3.5 ${s.trend === "up" ? "text-primary" : "text-destructive"}`} />
                        <span>{s.change} no último mês</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            {/* Content grid */}
            <section className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">Atividade recente</CardTitle>
                  <CardDescription>Adicione aqui seu gráfico ou lista principal.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-[image:var(--gradient-soft)] text-sm text-muted-foreground">
                    Área reservada para conteúdo
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">Destaques</CardTitle>
                  <CardDescription>Itens rápidos para consulta.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 transition hover:border-primary/40 hover:bg-accent/40">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[image:var(--gradient-primary)] text-xs font-semibold text-primary-foreground">
                        {i}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">Item de exemplo {i}</div>
                        <div className="text-xs text-muted-foreground">Substitua por conteúdo real</div>
                      </div>
                      <Badge variant="secondary" className="bg-secondary text-secondary-foreground">Novo</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
