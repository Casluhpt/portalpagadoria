import { createFileRoute } from '@tanstack/react-router';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import profarmaLogo from "@/assets/profarma-logo.png.asset.json";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, ShieldCheck, History, AlertTriangle } from "lucide-react";

export const Route = createFileRoute('/conciliacao')({
  component: BankReconciliationPage
});

function BankReconciliationPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <img src={profarmaLogo.url} alt="Profarma" className="h-7" />
            <div className="ml-2 flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-800">Conciliação Bancária</span>
              <span className="text-[11px] text-slate-500">Validação multi-fonte</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <HeaderActions />
            </div>
          </header>

          <main className="flex-1 space-y-6 p-6">
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="dashboard" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="conciliacao" className="gap-2">
                  <ShieldCheck className="h-4 w-4" /> Conciliar
                </TabsTrigger>
                <TabsTrigger value="historico" className="gap-2">
                  <History className="h-4 w-4" /> Histórico
                </TabsTrigger>
                <TabsTrigger value="pendencias" className="gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" /> Pendências
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500">Status Geral</h3>
                    <p className="mt-2 text-3xl font-bold text-slate-900">92.4%</p>
                    <p className="text-xs text-emerald-600 mt-1">Conciliado (Junho/2026)</p>
                  </div>
                  <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500">Divergências</h3>
                    <p className="mt-2 text-3xl font-bold text-amber-600">12</p>
                    <p className="text-xs text-slate-500 mt-1">Aguardando ajuste</p>
                  </div>
                  <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500">Pendências Críticas</h3>
                    <p className="mt-2 text-3xl font-bold text-red-600">2</p>
                    <p className="text-xs text-slate-500 mt-1">Sem retorno bancário</p>
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-8 text-center">
                  <p className="text-slate-500">Módulo de Conciliação em fase de implementação (v1.6.0).</p>
                </div>
              </TabsContent>

              <TabsContent value="conciliacao">
                <div className="flex items-center justify-center p-20 text-slate-400 border border-dashed rounded-lg">
                  Espaço para Importação de Arquivos Bankmanager / Itaú Varejo e Distribuição
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
