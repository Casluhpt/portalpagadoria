import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModuleStub } from "@/components/module-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle, ShieldCheck, Database, Zap, Bug, Cloud } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const [emailBackup, setEmailBackup] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold text-slate-700">Configurações Avançadas</h1>
          </header>
          <main className="flex-1 p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    Segurança e Integridade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Backup Diário por E-mail</Label>
                      <p className="text-xs text-muted-foreground">Envia a base de "Pagamentos Diversos" ao final do dia.</p>
                    </div>
                    <Switch checked={emailBackup} onCheckedChange={setEmailBackup} />
                  </div>
                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800">
                    <AlertCircle className="h-4 w-4 inline mr-2 mb-0.5" />
                    Configuração definitiva para o administrador definido.
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5 text-emerald-600" />
                    Diagnóstico do Portal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-center">
                      <Zap className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                      <p className="text-[10px] uppercase font-bold text-slate-500">Sobrecarga</p>
                      <p className="text-sm font-bold text-slate-700">Baixa (2%)</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-center">
                      <Bug className="h-5 w-5 mx-auto mb-1 text-red-500" />
                      <p className="text-[10px] uppercase font-bold text-slate-500">Erros/Vírus</p>
                      <p className="text-sm font-bold text-slate-700">Nenhum</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-center col-span-2">
                      <Cloud className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                      <p className="text-[10px] uppercase font-bold text-slate-500">Armazenamento em Nuvem</p>
                      <p className="text-sm font-bold text-slate-700">14.2 GB / 100 GB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <ModuleStub
              title="Configurações Avançadas"
              description="Parâmetros gerais do portal, Base Lista e regras de integração."
              phase="Fase 2"
              adminOnly
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
