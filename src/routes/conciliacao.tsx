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

              <TabsContent value="conciliacao" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</div>
                      Varejo (Itaú)
                    </h3>
                    <p className="text-xs text-slate-500">Importe o arquivo de retorno consolidado do Varejo para processamento.</p>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-10 text-center hover:border-blue-400 transition-colors cursor-pointer bg-slate-50/50">
                      <p className="text-sm text-slate-600 font-medium">Clique ou arraste o arquivo do Varejo</p>
                      <p className="text-[10px] text-slate-400 mt-1">Formatos suportados: .XLSX, .CSV, .TXT (Retorno)</p>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">2</div>
                      Distribuição (Itaú)
                    </h3>
                    <p className="text-xs text-slate-500">Importe o arquivo de retorno da Distribuição para conciliação.</p>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-10 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-slate-50/50">
                      <p className="text-sm text-slate-600 font-medium">Clique ou arraste o arquivo da Distribuição</p>
                      <p className="text-[10px] text-slate-400 mt-1">Formatos suportados: .XLSX, .CSV, .TXT (Retorno)</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" /> Comparativo Bankmanager
                  </h3>
                  <div className="h-48 flex items-center justify-center text-slate-400 border border-dashed rounded-lg bg-slate-50/50">
                    Aguardando arquivos para processar o cruzamento multi-fonte
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
