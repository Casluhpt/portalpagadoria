import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HeaderActions } from "@/components/header-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Calendar, Database, Users, TrendingUp } from "lucide-react";
import { fetchFechamentosPagamentos, fechamentoPagamentosKey } from "@/lib/fechamento-pagamentos";
import { useSession } from "@/hooks/use-session";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/fechamento")({
  component: FechamentoPage,
});

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function FechamentoPage() {
  const { user } = useSession();
  const { data: fechamentos, isLoading } = useQuery({
    queryKey: fechamentoPagamentosKey,
    queryFn: fetchFechamentosPagamentos,
    enabled: !!user,
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="truncate text-sm font-semibold text-foreground">Fechamento de Competência</h1>
            <div className="ml-auto">
              <HeaderActions />
            </div>
          </header>
          
          <main className="flex-1 space-y-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Histórico de Fechamentos</h2>
                <p className="text-sm text-muted-foreground">Área restrita para consulta de competências encerradas.</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white font-bold animate-pulse shadow-lg">
                <Info className="h-5 w-5" />
                <span>INFORMATIVO: DADOS ARQUIVADOS SÃO IMUTÁVEIS</span>
              </div>
            </div>

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-xl" />
                ))}
              </div>
            ) : fechamentos && fechamentos.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {fechamentos.map((f) => (
                  <Card key={f.id} className="overflow-hidden border-emerald-100 hover:shadow-md transition-shadow">
                    <CardHeader className="bg-emerald-50 py-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="truncate">{f.nome}</span>
                        <Calendar className="h-4 w-4 text-emerald-600" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-muted-foreground font-semibold">Competência</p>
                          <p className="text-sm font-medium">{f.mes}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[10px] uppercase text-muted-foreground font-semibold">Valor Total</p>
                          <p className="text-sm font-bold text-emerald-700">{brl(f.total_valor)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-muted-foreground font-semibold">Registros</p>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Database className="h-3 w-3 text-muted-foreground" />
                            {f.total_registros} itens
                          </div>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[10px] uppercase text-muted-foreground font-semibold">Data Encerramento</p>
                          <p className="text-sm">{new Date(f.criado_em).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Database className="mb-4 h-12 w-12 opacity-20" />
                  <p>Nenhum fechamento registrado até o momento.</p>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
