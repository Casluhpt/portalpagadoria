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
                <TabsTrigger value="semanal" className="gap-2">
                  <History className="h-4 w-4" /> Conciliação Semanal
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
                  <p className="text-slate-500">Módulo de Conciliação Bancária v1.9.0 em implementação.</p>
                  <div className="mt-4 text-left max-w-2xl mx-auto space-y-4">
                    <p className="text-sm text-slate-600 font-medium border-b pb-2">Próximos Passos:</p>
                    <ul className="text-sm text-slate-500 list-disc pl-5 space-y-2">
                      <li>Implementar a lógica de análise de correspondência (5 níveis) no conciliacao.tsx.</li>
                      <li>Conectar a importação de planilhas (Varejo/Distribuição) com as novas regras de validação.</li>
                      <li>Configurar o feedback de status por tooltip, conforme os requisitos de visualização dinâmica.</li>
                    </ul>
                  </div>
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

              <TabsContent value="semanal" className="space-y-6">
                <ConciliacaoSemanalView />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { exportarConciliacaoSemanal } from "@/lib/conciliacao-engine";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import { Download, Calendar as CalendarIcon, FileSpreadsheet } from "lucide-react";

function ConciliacaoSemanalView() {
  const { user } = useSession();
  const [dataIni, setDataIni] = useState("");
  const [dataFim, setDataFim] = useState("");

  const exportMut = useMutation({
    mutationFn: () => exportarConciliacaoSemanal(dataIni, dataFim, user!.id),
    onSuccess: () => {
      toast.success("Arquivo de conciliação semanal gerado e registrado no sino.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
          Extração Semanal (Referência: Pagamentos Diversos)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Data Início</Label>
            <Input type="date" value={dataIni} onChange={(e) => setDataIni(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data Fim</Label>
            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg bg-slate-50 p-4 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700">Resumo da Operação</h4>
          <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4">
            <li>Os títulos das colunas seguirão o padrão da base de <b>Pagamentos Diversos</b>.</li>
            <li>O arquivo será baixado localmente e uma cópia será vinculada à <b>Base de Anexos</b>.</li>
            <li>Uma notificação será enviada para o sino com atalho de download direto.</li>
          </ul>
        </div>

        <Button 
          className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2" 
          disabled={!dataIni || !dataFim || exportMut.isPending}
          onClick={() => exportMut.mutate()}
        >
          {exportMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Gerar Conciliação Semanal
        </Button>
      </CardContent>
    </Card>
  );
}

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState } from "react";
