import { createFileRoute, Link } from '@tanstack/react-router';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { AppLogo } from "@/components/app-logo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileSpreadsheet, 
  Search, 
  Calendar, 
  Building2, 
  Hash, 
  UserCircle2, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Filter, 
  ArrowRight,
  Download,
  Bell,
  Upload,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { format } from "date-fns";


export const Route = createFileRoute('/esocial')({
  component: ESocialPage
});

function ESocialPage() {
  const [mesFiltro, setMesFiltro] = useState("01/2026");
  const [busca, setBusca] = useState("");
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<"incremental" | "replace">("incremental");

  const { data: base = [], isLoading } = useQuery({
    queryKey: ['esocial_base', mesFiltro],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('esocial_base')
        .select('*')
        .eq('mes_ano', mesFiltro)
        .order('empresa', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  const importMut = useMutation({
    mutationFn: async (rows: any[]) => {
      if (importMode === 'replace') {
        const { error: delError } = await supabase
          .from('esocial_base')
          .delete()
          .eq('mes_ano', mesFiltro);
        if (delError) throw delError;
      }
      
      const { data, error } = await supabase
        .from('esocial_base')
        .insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ['esocial_base'] });
      toast.success(`${n} registro(s) importado(s) com sucesso.`);
    },
    onError: (e: any) => {
      toast.error(`Falha na importação: ${e.message}`);
    }
  });

  const handleImport = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          toast.error("O arquivo está vazio.");
          return;
        }

        // Mapping and Validation
        const expectedFields = [
          "Empresa", "Coligadas", "CNPJ", "INSS", "IRRF", "FGTS", "PIS", 
          "Lancamento", "FUPAG", "Compensado"
        ];
        
        const firstRow = json[0] as any;
        const missingFields = expectedFields.filter(f => !(f in firstRow));
        
        if (missingFields.length > 0) {
          toast.error(`Layout inválido. Campos ausentes: ${missingFields.join(", ")}. Por favor, utilize o modelo padrão.`);
          return;
        }

        const mappedRows = json.map((row: any) => ({
          empresa: row["Empresa"],
          nome_coligada: row["Coligadas"],
          cnpj: row["CNPJ"]?.toString(),
          valor_inss: parseFloat(row["INSS"]) || 0,
          valor_irrf: parseFloat(row["IRRF"]) || 0,
          valor_fgts: parseFloat(row["FGTS"]) || 0,
          valor_pis: parseFloat(row["PIS"]) || 0,
          status_lancamento: row["Lancamento"] || "Pendente",
          num_fopag: row["FUPAG"]?.toString(),
          dcomp_compensado: row["Compensado"] === "Sim" || row["Compensado"] === true,
          mes_ano: mesFiltro
        }));

        importMut.mutate(mappedRows);
      } catch (err: any) {
        toast.error(`Erro ao processar arquivo: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredData = useMemo(() => {
    return base.filter(item => 
      item.empresa?.toLowerCase().includes(busca.toLowerCase()) || 
      item.cnpj?.includes(busca) ||
      item.nome_coligada?.toLowerCase().includes(busca.toLowerCase())
    );
  }, [base, busca]);

  const stats = useMemo(() => {
    const pendentes = base.filter(i => i.status_lancamento === 'Pendente' && !i.num_fopag && !i.dcomp_compensado).length;
    
    const inss = base.reduce((acc, i) => acc + (Number(i.valor_inss) || 0), 0);
    const irrf = base.reduce((acc, i) => acc + (Number(i.valor_irrf) || 0), 0);
    const fgts = base.reduce((acc, i) => acc + (Number(i.valor_fgts) || 0), 0);
    const pis = base.reduce((acc, i) => acc + (Number(i.valor_pis) || 0), 0);
    
    const totalMes = inss + irrf + fgts + pis;
    return { pendentes, totalMes, inss, irrf, fgts, pis };
  }, [base]);


  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted dark:bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur dark:bg-card/90 dark:border-border">
            <SidebarTrigger />
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <AppLogo area="header" className="h-6 w-auto shrink-0 sm:h-7" />
              <div className="ml-2 flex min-w-0 flex-col leading-tight">
                <span className="text-sm font-semibold text-foreground dark:text-foreground">Controle E-Social</span>
                <span className="hidden truncate text-[11px] text-muted-foreground sm:block">Acompanhamento Mensal de Lançamentos</span>
              </div>
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <HeaderActions />
            </div>
          </header>

          <main className="flex-1 space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-lg overflow-hidden relative">
                <div className="absolute right-0 top-0 p-4 opacity-10">
                  <Bell className="h-20 w-20" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Pendências de Lançamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.pendentes}</div>
                  <p className="text-xs text-indigo-100 mt-1">Registros sem FOPAG ou DCOMP no mês</p>
                </CardContent>
              </Card>

              <Card className="border-border dark:border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Mês de Referência
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={mesFiltro} onValueChange={setMesFiltro}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const m = (i + 1).toString().padStart(2, '0');
                        return <SelectItem key={m} value={`${m}/2026`}>{m}/2026</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="border-border dark:border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Total de Impostos no Mês
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-muted">
                          <Info className="h-3.5 w-3.5 text-indigo-600" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3 shadow-xl border-border bg-card" align="end">
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Detalhamento da Soma</h4>
                          <div className="grid grid-cols-2 gap-y-1 text-xs">
                            <span className="text-muted-foreground">INSS:</span>
                            <span className="font-medium text-right">{stats.inss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            
                            <span className="text-muted-foreground">IRRF:</span>
                            <span className="font-medium text-right">{stats.irrf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            
                            <span className="text-muted-foreground">FGTS:</span>
                            <span className="font-medium text-right">{stats.fgts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            
                            <span className="text-muted-foreground">PIS:</span>
                            <span className="font-medium text-right">{stats.pis.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground dark:text-foreground">
                    {stats.totalMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Soma de INSS, IRRF, FGTS e PIS</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por empresa, CNPJ ou coligada..." 
                  className="pl-10"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-border bg-card p-1">
                  <Button 
                    variant={importMode === 'incremental' ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-7 text-[10px] uppercase font-bold"
                    onClick={() => setImportMode('incremental')}
                  >
                    Incremental
                  </Button>
                  <Button 
                    variant={importMode === 'replace' ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-7 text-[10px] uppercase font-bold"
                    onClick={() => setImportMode('replace')}
                  >
                    Substituir
                  </Button>
                </div>

                <input 
                  type="file" 
                  ref={fileRef} 
                  className="hidden" 
                  accept=".xlsx,.xls" 
                  onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])} 
                />

                <Button variant="outline" size="sm" className="hover:bg-accent/50" onClick={() => {
                  try {
                    const ws = XLSX.utils.json_to_sheet([{
                      "Empresa": "Exemplo LTDA",
                      "Coligadas": "Coligada A",
                      "CNPJ": "00.000.000/0000-00",
                      "INSS": 1500.50,
                      "IRRF": 300.20,
                      "FGTS": 800.00,
                      "PIS": 150.00,
                      "Lancamento": "Pendente",
                      "FUPAG": "12345",
                      "Compensado": "Não"
                    }]);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
                    XLSX.writeFile(wb, "modelo_esocial.xlsx");
                    toast.success("Modelo baixado com sucesso");
                  } catch (e) {
                    toast.error("Erro ao gerar modelo");
                  }
                }}>
                  <Download className="mr-2 h-4 w-4 text-muted-foreground" /> Modelo
                </Button>
                
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-sm active:scale-95 transition-all" 
                  size="sm" 
                  onClick={() => fileRef.current?.click()}
                  disabled={importMut.isPending}
                >
                  {importMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
                  Importar Excel
                </Button>
              </div>
            </div>

            <Card className="border-border dark:border-border overflow-hidden">
              <CardHeader className="bg-muted/50 dark:bg-muted/50 border-b dark:border-border">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-indigo-600" /> Base de Acompanhamento E-Social
                </CardTitle>
                <CardDescription>Visualização detalhada dos lançamentos e compensações.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted dark:bg-card dark:text-muted-foreground border-b dark:border-border">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Empresa</th>
                      <th className="px-4 py-3 font-semibold">Coligadas</th>
                      <th className="px-4 py-3 font-semibold">CNPJ</th>
                      <th className="px-4 py-3 font-semibold text-right">INSS</th>
                      <th className="px-4 py-3 font-semibold text-right">IRRF</th>
                      <th className="px-4 py-3 font-semibold text-right">FGTS</th>
                      <th className="px-4 py-3 font-semibold text-right">PIS</th>
                      <th className="px-4 py-3 font-semibold">Lançamento</th>
                      <th className="px-4 py-3 font-semibold">FUPAG</th>
                      <th className="px-4 py-3 font-semibold">Compensado</th>
                      <th className="px-4 py-3 font-semibold text-center">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y dark:divide-border">
                    {isLoading ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">
                          Carregando base...
                        </td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">
                          Nenhum registro encontrado para {mesFiltro}.
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((item) => {
                        const isOk = item.num_fopag || item.dcomp_compensado;
                        return (
                          <tr key={item.id} className={`hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors ${!isOk ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                            <td className="px-4 py-3 font-medium text-foreground dark:text-foreground">{item.empresa}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs uppercase">{item.nome_coligada}</td>
                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{item.cnpj}</td>
                            <td className="px-4 py-3 text-right text-xs">{Number(item.valor_inss).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="px-4 py-3 text-right text-xs">{Number(item.valor_irrf).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="px-4 py-3 text-right text-xs">{Number(item.valor_fgts).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="px-4 py-3 text-right text-xs">{Number(item.valor_pis).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={item.status_lancamento === 'Concluído' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground"}>
                                {item.status_lancamento}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">
                              {item.num_fopag || <span className="text-muted-foreground opacity-50">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              {item.dcomp_compensado ? (
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none text-[10px]">SIM (DCOMP)</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground opacity-50">NÃO</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-indigo-600">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}

                  </tbody>
                </table>
              </CardContent>
            </Card>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex gap-3 items-start dark:bg-amber-900/10 dark:border-amber-900/30">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <p className="font-semibold mb-1">Nota de Segurança e Governança:</p>
                <p>Caso algum valor não tenha dado baixa (sem o n° do fopag ou DCOMP), o sistema emitirá uma notificação automática para os usuários responsáveis pelos lançamentos.</p>
                <p className="mt-1">A "Base de Pagamentos Diversos" é enviada diariamente para o e-mail do administrador configurado em "Configurações Técnicas &gt; Segurança Avançada".</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}