import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import profarmaLogo from "@/assets/profarma-logo.png.asset.json";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, ShieldCheck, History, AlertTriangle } from "lucide-react";

export const Route = createFileRoute('/conciliacao')({
  beforeLoad: async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { returnTo: "/conciliacao" } });
    }
  },
  component: BankReconciliationPage
});

function BankReconciliationPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur">
            <SidebarTrigger />
            <img src={profarmaLogo.url} alt="Profarma" className="h-7" />
            <div className="ml-2 flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">Conciliação Bancária</span>
              <span className="text-[11px] text-muted-foreground">Validação multi-fonte</span>
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
                  <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-muted-foreground">Status Geral</h3>
                    <p className="mt-2 text-3xl font-bold text-foreground">92.4%</p>
                    <p className="text-xs text-emerald-600 mt-1">Conciliado (Junho/2026)</p>
                  </div>
                  <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-muted-foreground">Divergências</h3>
                    <p className="mt-2 text-3xl font-bold text-amber-600">12</p>
                    <p className="text-xs text-muted-foreground mt-1">Aguardando ajuste</p>
                  </div>
                  <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-muted-foreground">Pendências Críticas</h3>
                    <p className="mt-2 text-3xl font-bold text-red-600">2</p>
                    <p className="text-xs text-muted-foreground mt-1">Sem retorno bancário</p>
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-8 text-center">
                  <p className="text-muted-foreground">Módulo de Conciliação Bancária v1.9.0 em implementação.</p>
                  <div className="mt-4 text-left max-w-2xl mx-auto space-y-4">
                    <p className="text-sm text-indigo-600 font-bold border-b border-indigo-100 pb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Próximos Passos (Engine de Conciliação):
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-3">
                      <li className="flex gap-3">
                        <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</div>
                        <span><b>Níveis 1 e 2:</b> Correspondência exata e por data próxima (+/- 2 dias) implementadas.</span>
                      </li>
                      <li className="flex gap-3">
                        <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</div>
                        <span><b>Nível 3:</b> Lógica de Soma (SubSet Sum) para agrupar múltiplos títulos bancários integrada.</span>
                      </li>
                      <li className="flex gap-3">
                        <div className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">→</div>
                        <span><b>Nível 4 (Ajuste de Tarifa):</b> Configurar tolerância de centavos para conciliação automática de tarifas bancárias.</span>
                      </li>
                      <li className="flex gap-3">
                        <div className="h-5 w-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">!</div>
                        <span><b>Interface Dinâmica:</b> Adicionar tooltips detalhados para exibir quais IDs compõem a sugestão do Nível 3.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="conciliacao" className="space-y-6">
                <ConciliacaoAtivaView />
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
    <Card className="border-border">
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

        <div className="flex flex-col gap-3 rounded-lg bg-muted p-4 border border-border">
          <h4 className="text-sm font-semibold text-foreground">Resumo da Operação</h4>
          <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
            <li>Os títulos das colunas seguirão o padrão da base de <b>Pagamentos Diversos</b>.</li>
            <li>O arquivo será baixado localmente e uma cópia será vinculada à <b>[anexo]</b>.</li>
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
import { Loader2, Upload, FileText, CheckCircle2, XCircle } from "lucide-react";
import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { executarConciliacao } from "@/lib/conciliacao-engine";

function ConciliacaoAtivaView() {
  const { user } = useSession();
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState<"Varejo" | "Distribuição" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tipo || !user) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);

          if (!data.length) throw new Error("Arquivo vazio");

          toast.info(`Processando ${data.length} registros de ${tipo}...`);
          
          // Executar engine de conciliação multi-nível
          await executarConciliacao(tipo, data, user.id);
          
          toast.success(`Conciliação de ${tipo} concluída com sucesso! Verifique seu sino.`);
        } catch (err: any) {
          toast.error("Erro no processamento: " + err.message);
        } finally {
          setLoading(false);
          if (fileRef.current) fileRef.current.value = "";
        }
      };
      reader.readAsBinaryString(file);
    } catch (err: any) {
      toast.error("Erro ao ler arquivo");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <input type="file" ref={fileRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFile} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-blue-100 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">1</div>
              Varejo (Itaú)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">Importe o arquivo de retorno consolidado do Varejo.</p>
            <Button 
              variant="outline" 
              className="w-full h-24 border-dashed border-2 hover:border-blue-400 hover:bg-blue-50/50 flex-col gap-2"
              onClick={() => { setTipo("Varejo"); fileRef.current?.click(); }}
              disabled={loading}
            >
              {loading && tipo === "Varejo" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 text-blue-500" />}
              <span className="text-xs font-medium">Selecionar arquivo Varejo</span>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">2</div>
              Distribuição (Itaú)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">Importe o arquivo de retorno da Distribuição.</p>
            <Button 
              variant="outline" 
              className="w-full h-24 border-dashed border-2 hover:border-indigo-400 hover:bg-indigo-50/50 flex-col gap-2"
              onClick={() => { setTipo("Distribuição"); fileRef.current?.click(); }}
              disabled={loading}
            >
              {loading && tipo === "Distribuição" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 text-indigo-500" />}
              <span className="text-xs font-medium">Selecionar arquivo Distribuição</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3 border-b bg-muted/50">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Funcionamento da Conciliação Multi-nível
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 divide-x divide-border">
            {[
              { level: 1, label: "Exata", desc: "Data, Empresa e Valor idênticos.", icon: CheckCircle2, color: "text-emerald-500" },
              { level: 2, label: "Data Próxima", desc: "Empresa e Valor exatos, data +/- 2 dias.", icon: CheckCircle2, color: "text-blue-500" },
              { level: 3, label: "Soma (SubSet)", desc: "Um valor do arquivo é a soma de vários títulos.", icon: Sparkles, color: "text-violet-500" },
              { level: 4, label: "Ajuste de Tarifa", desc: "Valor com diferença mínima aceitável.", icon: AlertTriangle, color: "text-amber-500" },
              { level: 5, label: "Divergência", desc: "Nenhuma correspondência encontrada.", icon: XCircle, color: "text-red-500" },
            ].map((n) => (
              <div key={n.level} className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <n.icon className={`h-4 w-4 ${n.color}`} />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nível {n.level}</span>
                </div>
                <p className="text-xs font-bold text-foreground">{n.label}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{n.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Sparkles } from "lucide-react";
