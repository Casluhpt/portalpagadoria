import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/divergencias")({
  component: DivergenciasPage,
});

function DivergenciasPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold text-slate-700">Central de Divergências</h1>
          </header>
          <ModuleStub
            title="Central de Divergências"
            description="Monitoramento e tratativa de divergências LG × Bankmanager × Itaú e conciliações bancárias."
            phase="Fase 4"
          />
        </div>
      </div>
    </SidebarProvider>
  );
}
