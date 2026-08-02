import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/fechamento")({
  component: FechamentoPage,
});

function FechamentoPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold text-slate-700">Fechamento de Competência</h1>
          </header>
          <main className="flex-1 p-6 space-y-6">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold text-sm">Área Crítica: O fechamento de competência limpa as bases ativas e gera arquivos de backup.</span>
              </div>
              <Button variant="destructive" size="sm">Ação de Fechamento</Button>
            </div>
            <ModuleStub
              title="Fechamento de Competência"
              description="Validação, fechamento, arquivamento e reabertura administrativa das competências. Esta área é separada por cards com meses definidos dos salvos."
              phase="Fase 4"
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
