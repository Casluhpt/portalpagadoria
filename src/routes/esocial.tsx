import { createFileRoute } from '@tanstack/react-router';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import profarmaLogo from "@/assets/profarma-logo.png.asset.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, AlertCircle, CheckCircle, Clock } from "lucide-react";

export const Route = createFileRoute('/esocial')({
  component: ESocialPage
});

function ESocialPage() {
  const impostos = [
    { nome: "INSS", status: "Transmitido", data: "15/07/2026", color: "bg-emerald-100 text-emerald-700" },
    { nome: "IRRF", status: "Pendente", data: "20/07/2026", color: "bg-amber-100 text-amber-700" },
    { nome: "FGTS", status: "Aguardando", data: "07/08/2026", color: "bg-slate-100 text-slate-700" },
    { nome: "PIS/COFINS", status: "Erro Retorno", data: "15/07/2026", color: "bg-red-100 text-red-700" },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <img src={profarmaLogo.url} alt="Profarma" className="h-7" />
            <div className="ml-2 flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-800">Controle E-Social</span>
              <span className="text-[11px] text-slate-500">Eventos e Impostos</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <HeaderActions />
            </div>
          </header>

          <main className="flex-1 space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {impostos.map((imp) => (
                <Card key={imp.nome}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex justify-between items-center">
                      {imp.nome}
                      <Badge className={imp.color}>{imp.status}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> Vencimento: {imp.data}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-indigo-600" /> Monitoramento de Eventos S-1200 / S-1210
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-slate-400 border border-dashed rounded-lg">
                  Base de Eventos E-Social v1.6.0
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
