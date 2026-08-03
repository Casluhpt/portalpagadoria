import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLogo } from "@/components/app-logo";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileArchive, Upload, FolderOpen, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/anexos")({
  component: AnexosPage,
});

function AnexosPage() {
  const categorias = [
    "Comprovantes",
    "Relatórios",
    "Arquivos bancários",
    "Layouts",
    "Documentações",
    "Evidências operacionais",
    "Conciliação bancaria",
    "Processo de aprovação",
  ];
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <Link to="/" className="flex flex-1 items-center gap-2 hover:opacity-80 transition-opacity">
              <AppLogo area="header" className="h-6 w-auto shrink-0 sm:h-7" />
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold text-foreground">[anexo]</h1>
                <p className="hidden truncate text-[10px] text-muted-foreground sm:block">Repositório de documentos digitais</p>
              </div>
            </Link>
            <div className="ml-auto">
              <HeaderActions />
            </div>
          </header>
          <main className="flex-1 space-y-6 p-6">
            <Card className="border-border">
              <CardContent className="flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow">
                    <FileArchive className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">[anexo]</h2>
                    <p className="text-sm text-muted-foreground">
                      Centralização de comprovantes, relatórios, layouts e evidências operacionais.
                    </p>
                  </div>
                </div>
                <Button className="bg-secondary hover:bg-card">
                  <Upload className="mr-2 h-4 w-4" /> Enviar arquivo
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categorias.map((c) => (
                <Card key={c} className="border-border transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-5">
                    <FolderOpen className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">{c}</p>
                      <p className="text-xs text-muted-foreground">Nenhum arquivo</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Integração futura: SharePoint, OneDrive e Power BI.
            </p>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
