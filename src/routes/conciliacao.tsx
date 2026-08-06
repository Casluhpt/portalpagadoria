import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { AppLogo } from "@/components/app-logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  ShieldCheck, 
  History, 
  AlertTriangle, 
  BarChart3,
  FileSpreadsheet,
  Download,
  Loader2,
  Upload,
  CheckCircle2,
  XCircle,
  Sparkles
} from "lucide-react";
import { useState, useRef, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useSession } from "@/hooks/use-session";
import { 
  executarConciliacao, 
  exportarConciliacaoSemanal,
  ConciliacaoItem 
} from "@/lib/conciliacao-engine";
import { getPagamentosParaConciliacao } from "@/lib/conciliacao.functions";
import { ConciliacaoResultadosView } from "@/components/conciliacao/conciliacao-resultados";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

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
  const [activeTab, setActiveTab] = useState("dashboard");
  const [results, setResults] = useState<ConciliacaoItem[]>([]);

  const handleResults = (newResults: ConciliacaoItem[]) => {
    setResults(newResults);
    setActiveTab("resultados");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur">
            <SidebarTrigger />
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <AppLogo area="header" className="h-6 w-auto shrink-0 sm:h-7" />
              <div className="ml-2 flex flex-col leading-tight">
                <span className="text-sm font-semibold text-foreground">Conciliação Bancária</span>
                <span className="text-[11px] text-muted-foreground">Inteligência Financeira</span>
              </div>
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <HeaderActions />
            </div>
          </header>

          <main className="flex-1 space-y-6 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="dashboard" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="conciliacao" className="gap-2">
                  <ShieldCheck className="h-4 w-4" /> Conciliar
                </TabsTrigger>
                {results.length > 0 && (
                  <TabsTrigger value="resultados" className="gap-2">
                    <BarChart3 className="h-4 w-4" /> Resultados
                  </TabsTrigger>
                )}
                <TabsTrigger value="semanal" className="gap-2">
                  <History className="h-4 w-4" /> Semanal
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

                <div className="rounded-xl border bg-card p-8 text-center bg-white/5 backdrop-blur-sm">
                  <p className="text-muted-foreground font-medium">Conciliação Bancária v2.0</p>
                  <div className="mt-4 text-left max-w-2xl mx-auto space-y-4">
                    <p className="text-sm text-primary font-bold border-b border-primary/20 pb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Tecnologias de Conciliação Ativas:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-3">
                      <li className="flex gap-3">
                        <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</div>
                        <span><b>Multi-Factor Matching:</b> Validação cruzada de Empresa, Banco, Data, Valor e Favorecido.</span>
                      </li>
                      <li className="flex gap-3">
                        <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</div>
                        <span><b>Confidence Scoring:</b> Cálculo de probabilidade de acerto com tolerância para centavos.</span>
                      </li>
                      <li className="flex gap-3">
                        <div className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">→</div>
                        <span><b>Detecção de Tarifas:</b> Identificação automática de taxas e encargos bancários.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="conciliacao" className="space-y-6">
                <ConciliacaoAtivaView onResults={handleResults} />
              </TabsContent>

              {results.length > 0 && (
                <TabsContent value="resultados" className="space-y-6">
                  <ConciliacaoResultadosView data={results} onClear={() => setResults([])} />
                </TabsContent>
              )}

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

function ConciliacaoAtivaView({ onResults }: { onResults: (res: ConciliacaoItem[]) => void }) {
  const { user } = useSession();
  const [loading, setLoading] = useState(false);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: pagamentosPortal } = useQuery({
    queryKey: ['pagamentos-conciliacao', dataInicio, dataFim],
    queryFn: () => getPagamentosParaConciliacao({ data: { dataInicio, dataFim } }),
    enabled: !!dataInicio && !!dataFim
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !pagamentosPortal) {
      if (!dataInicio || !dataFim) toast.error("Selecione o período (início e fim) antes de importar.");
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const importData = XLSX.utils.sheet_to_json(ws);

          if (!importData.length) throw new Error("Arquivo vazio");

          toast.info(`Processando ${importData.length} registros bancários...`);
          
          const resultados = await executarConciliacao(importData, pagamentosPortal, user.id);
          
          toast.success(`Processamento concluído!`);
          onResults(resultados);
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-card/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">1</div>
              Configurar Origem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input 
                  type="date"
                  value={dataInicio} 
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input 
                  type="date"
                  value={dataFim} 
                  onChange={(e) => setDataFim(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              O sistema buscará os registros de "Pagamentos Diversos" deste período para comparar.
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-card/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px] font-bold">2</div>
              Importar Extrato Bancário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">O motor inteligente identificará automaticamente os campos de valor, data e banco.</p>
            <Button 
              variant="outline" 
              className="w-full h-24 border-dashed border-2 hover:border-emerald-500/40 hover:bg-emerald-500/5 flex-col gap-2 group transition-all"
              onClick={() => fileRef.current?.click()}
              disabled={loading || !dataInicio || !dataFim}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
              )}
              <span className="text-xs font-medium">Selecionar Arquivo Bancário</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 bg-card/30 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-white/5 bg-white/5">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Motor de Conciliação 2.0
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid md:grid-cols-5 divide-x divide-white/5">
            {[
              { level: 1, label: "Exata", desc: "Confiança 90-100%", icon: CheckCircle2, color: "text-emerald-500" },
              { level: 2, label: "Aproximada", desc: "Data +/- 2 dias", icon: CheckCircle2, color: "text-blue-500" },
              { level: 3, label: "Divergente", desc: "Necessita Justificativa", icon: AlertTriangle, color: "text-amber-500" },
              { level: 4, label: "Tarifas", desc: "Ajuste < R$ 20,00", icon: Sparkles, color: "text-violet-500" },
              { level: 5, label: "Desconhecido", desc: "Sem referência", icon: XCircle, color: "text-red-500" },
            ].map((n) => (
              <div key={n.level} className="p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <n.icon className={`h-3 w-3 ${n.color}`} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">LV {n.level}</span>
                </div>
                <p className="text-[10px] font-bold text-foreground">{n.label}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">{n.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConciliacaoSemanalView() {
  const { user } = useSession();
  const [dataIni, setDataIni] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [formato, setFormato] = useState<"xlsx" | "csv">("xlsx");

  const exportMut = useMutation({
    mutationFn: () => {
      if (!dataIni || !dataFim) {
        throw new Error("Por favor, selecione as datas de início e fim.");
      }
      const dIni = new Date(dataIni);
      const dFim = new Date(dataFim);
      if (dFim < dIni) {
        throw new Error("A data fim não pode ser anterior à data de início.");
      }
      // Opcional: Impedir períodos muito longos se necessário (ex: > 3 anos)
      const diffTime = Math.abs(dFim.getTime() - dIni.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 365) {
        toast.warning("Períodos superiores a 1 ano podem demorar para processar.");
      }
      return exportarConciliacaoSemanal(dataIni, dataFim, user!.id, formato);
    },
    onSuccess: () => {
      toast.success(`Extração (${formato.toUpperCase()}) gerada e enviada para o seu sino.`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handlePrintPDF = () => {
    if (!dataIni || !dataFim) {
      toast.error("Selecione o período para exportar PDF.");
      return;
    }
    if (new Date(dataFim) < new Date(dataIni)) {
      toast.error("Data inválida: Fim anterior ao Início.");
      return;
    }
    window.print();
  };

  const { data: previewData, isLoading: isPreviewLoading } = useQuery({
    queryKey: ['conciliacao-preview', dataIni, dataFim],
    queryFn: () => getPagamentosParaConciliacao({ data: { dataInicio: dataIni, dataFim } }),
    enabled: !!dataIni && !!dataFim && new Date(dataFim) >= new Date(dataIni)
  });

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
          Extração por Período
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Início do Período</Label>
            <Input type="date" value={dataIni} onChange={(e) => setDataIni(e.target.value)} className="bg-white/5 border-white/10" />
          </div>
          <div className="space-y-2">
            <Label>Fim do Período</Label>
            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="bg-white/5 border-white/10" />
          </div>
          <div className="space-y-2">
            <Label>Formato</Label>
            <Select value={formato} onValueChange={(v: any) => setFormato(v)}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2 font-bold shadow-lg shadow-emerald-600/20" 
            disabled={!dataIni || !dataFim || exportMut.isPending}
            onClick={() => exportMut.mutate()}
          >
            {exportMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Gerar Relatório {formato.toUpperCase()}
          </Button>
          
          <Button 
            variant="outline"
            className="flex-1 gap-2 font-bold border-red-500/20 text-red-400 hover:bg-red-500/10"
            onClick={handlePrintPDF}
            disabled={!dataIni || !dataFim}
          >
            <XCircle className="h-4 w-4" />
            Exportar para PDF
          </Button>
        </div>

        {dataIni && dataFim && new Date(dataFim) < new Date(dataIni) && (
          <p className="text-xs text-red-500 animate-pulse mt-4">
            Atenção: A data final é anterior à data inicial. Verifique o intervalo.
          </p>
        )}

        {previewData && previewData.length > 0 && (
          <div className="mt-8 space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Prévia dos Resultados ({previewData.length} registros encontrados)
            </h4>
            <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
              <div className="max-h-[300px] overflow-auto">
                <table className="w-full text-[11px] text-left">
                  <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm border-b border-white/10">
                    <tr>
                      <th className="p-2 font-bold uppercase tracking-wider text-muted-foreground">Data</th>
                      <th className="p-2 font-bold uppercase tracking-wider text-muted-foreground">Empresa</th>
                      <th className="p-2 font-bold uppercase tracking-wider text-muted-foreground">Favorecido</th>
                      <th className="p-2 font-bold uppercase tracking-wider text-muted-foreground text-right">Valor</th>
                      <th className="p-2 font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {previewData.slice(0, 50).map((item: any) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-2">{new Date(item.data_credito).toLocaleDateString('pt-BR')}</td>
                        <td className="p-2 font-medium">{item.empresa}</td>
                        <td className="p-2 truncate max-w-[150px]">{item.favorecido}</td>
                        <td className="p-2 text-right font-mono">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_lg || 0)}
                        </td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            item.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {item.status || 'Pendente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {previewData.length > 50 && (
                      <tr>
                        <td colSpan={5} className="p-2 text-center text-muted-foreground italic border-t border-white/5">
                          Exibindo primeiros 50 de {previewData.length} registros.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!isPreviewLoading && previewData && previewData.length === 0 && dataIni && dataFim && new Date(dataFim) >= new Date(dataIni) && (
          <div className="mt-8 p-6 rounded-lg border border-dashed border-white/10 text-center bg-white/5">
            <p className="text-sm text-muted-foreground italic">Nenhum registro encontrado para este período.</p>
          </div>
        )}

        {isPreviewLoading && (
          <div className="mt-8 flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
