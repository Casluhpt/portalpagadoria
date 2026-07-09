import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/pagamentos")({
  component: PagamentosPage,
});

function PagamentosPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold text-slate-700">Pagamentos Diversos</h1>
          </header>
          <ModuleStub
            title="Pagamentos Diversos"
            description="Gestão de pagamentos diversos, importação Excel, versionamento mensal e conciliação LG × Bankmanager × Itaú."
            phase="Fase 2"
          />
        </div>
      </div>
    </SidebarProvider>
  );
}
