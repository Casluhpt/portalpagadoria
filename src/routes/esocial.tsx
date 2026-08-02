import { createFileRoute } from '@tanstack/react-router';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import profarmaLogo from "@/assets/profarma-logo.png.asset.json";
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
  Bell
} from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute('/esocial')({
  component: ESocialPage
});

function ESocialPage() {
  const [mesFiltro, setMesFiltro] = useState("01/2026");
  const [busca, setBusca] = useState("");

  const { data: base = [], isLoading } = useQuery({
    queryKey: ['esocial_base', mesFiltro],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('esocial_base')
        .select('*')
        .eq('mes_ano', mesFiltro);
      if (error) throw error;
      return data || [];
    }
  });

  const filteredData = useMemo(() => {
    return base.filter(item => 
      item.empresa?.toLowerCase().includes(busca.toLowerCase()) || 
      item.cnpj?.includes(busca) ||
      item.nome_coligada?.toLowerCase().includes(busca.toLowerCase())
    );
  }, [base, busca]);

  const stats = useMemo(() => {
    const pendentes = base.filter(i => i.status_lancamento === 'Pendente' && !i.num_fopag && !i.dcomp_compensado).length;
    const totalMes = base.reduce((acc, i) => acc + (Number(i.valor_inss) + Number(i.valor_irrf) + Number(i.valor_fgts) + Number(i.valor_pis)), 0);
    return { pendentes, totalMes };
  }, [base]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted dark:bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur dark:bg-card/90 dark:border-border">
            <SidebarTrigger />
            <img src={profarmaLogo.url} alt="Profarma" className="h-7" />
            <div className="ml-2 flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground dark:text-foreground">Controle E-Social</span>
              <span className="text-[11px] text-muted-foreground">Acompanhamento Mensal de Lançamentos</span>
            </div>
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
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Total de Impostos no Mês
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
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" /> Exportar Base
                </Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700" size="sm">
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Importar Excel
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
                      <th className="px-4 py-3 font-semibold">Empresa / Coligada</th>
                      <th className="px-4 py-3 font-semibold">CNPJ</th>
                      <th className="px-4 py-3 font-semibold text-right">INSS / IRRF</th>
                      <th className="px-4 py-3 font-semibold text-right">FGTS / PIS</th>
                      <th className="px-4 py-3 font-semibold">Lançamento / FOPAG</th>
                      <th className="px-4 py-3 font-semibold">Compensado</th>
                      <th className="px-4 py-3 font-semibold text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-border">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          Carregando base...
                        </td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          Nenhum registro encontrado para {mesFiltro}.
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((item) => {
                        const isOk = item.num_fopag || item.dcomp_compensado;
                        return (
                          <tr key={item.id} className={`hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors ${!isOk ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-foreground dark:text-foreground">{item.empresa}</div>
                              <div className="text-[10px] text-muted-foreground uppercase">{item.nome_coligada} · {item.bandeira}</div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground dark:text-muted-foreground font-mono text-xs">{item.cnpj}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="text-xs"><span className="text-muted-foreground">INSS:</span> {Number(item.valor_inss).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                              <div className="text-xs"><span className="text-muted-foreground">IRRF:</span> {Number(item.valor_irrf).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="text-xs"><span className="text-muted-foreground">FGTS:</span> {Number(item.valor_fgts).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                              <div className="text-xs"><span className="text-muted-foreground">PIS:</span> {Number(item.valor_pis).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                            </td>
                            <td className="px-4 py-3">
                              {item.num_fopag ? (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 font-mono">
                                  <CheckCircle2 className="h-3 w-3" /> {item.num_fopag}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-muted text-muted-foreground border-border gap-1">
                                  Pendente
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {item.dcomp_compensado ? (
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">DCOMP = Compensado</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
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