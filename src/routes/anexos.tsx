import { createFileRoute, Link } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
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
  ];
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-white/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <Button asChild variant="ghost" size="sm">
              <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Portal</Link>
            </Button>
            <h1 className="ml-2 font-semibold text-slate-800">Base de Anexos</h1>
          </header>
          <main className="flex-1 space-y-6 p-6">
            <Card className="border-slate-200">
              <CardContent className="flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow">
                    <FileArchive className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Documentos da Pagadoria</h2>
                    <p className="text-sm text-slate-600">
                      Centralização de comprovantes, relatórios, layouts e evidências operacionais.
                    </p>
                  </div>
                </div>
                <Button className="bg-slate-800 hover:bg-slate-900">
                  <Upload className="mr-2 h-4 w-4" /> Enviar arquivo
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categorias.map((c) => (
                <Card key={c} className="border-slate-200 transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-5">
                    <FolderOpen className="h-8 w-8 text-slate-500" />
                    <div>
                      <p className="font-semibold text-slate-800">{c}</p>
                      <p className="text-xs text-slate-500">Nenhum arquivo</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-center text-xs text-slate-400">
              Integração futura: SharePoint, OneDrive e Power BI.
            </p>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
