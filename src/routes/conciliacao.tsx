import { createFileRoute, Link } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowLeft, CheckCircle2, AlertTriangle, Percent, Clock, ShieldAlert } from "lucide-react";
import { useRoles } from "@/hooks/use-roles";

export const Route = createFileRoute("/conciliacao")({
  component: ConciliacaoPage,
});

function ConciliacaoPage() {
  const { isAdmin, loading } = useRoles();
  const kpis = [
    { label: "Total conciliado", value: "—", icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "Total pendente", value: "—", icon: Clock, tone: "text-amber-600" },
    { label: "Divergências", value: "—", icon: AlertTriangle, tone: "text-rose-600" },
    { label: "% de conciliação", value: "—", icon: Percent, tone: "text-violet-600" },
  ];
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-white/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <Button asChild variant="ghost" size="sm">
              <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Portal</Link>
            </Button>
            <h1 className="ml-2 font-semibold text-slate-800">Conciliação Bancária</h1>
          </header>
          <main className="flex-1 space-y-6 p-6">
            <Card className="border-slate-200">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-purple-700 to-fuchsia-800 text-white shadow">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Validação de pagamentos</h2>
                  <p className="text-sm text-slate-600">
                    Monitoramento de divergências entre pagamentos executados e retornos bancários.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {kpis.map((k) => (
                <Card key={k.label} className="border-slate-200">
                  <CardContent className="flex items-center gap-3 p-5">
                    <k.icon className={`h-8 w-8 ${k.tone}`} />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">{k.label}</p>
                      <p className="text-2xl font-bold text-slate-900">{k.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-dashed border-slate-300">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-slate-600">
                  Base de Conciliação ainda não configurada. Importe o retorno bancário para iniciar
                  a validação automática.
                </p>
                <Button className="mt-4 bg-gradient-to-r from-purple-700 to-fuchsia-800 text-white">
                  Configurar base
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
