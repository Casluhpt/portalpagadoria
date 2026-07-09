import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/dashboard-gerencial")({
  component: DashboardGerencialPage,
});

function DashboardGerencialPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold text-slate-700">Dashboard Gerencial</h1>
          </header>
          <ModuleStub
            title="Dashboard Gerencial"
            description="Indicadores consolidados por empresa, banco, competência, natureza e folha."
            phase="Fase 6"
          />
        </div>
      </div>
    </SidebarProvider>
  );
}
