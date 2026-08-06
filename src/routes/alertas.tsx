import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/alertas")({
  head: () => ({
    meta: [
      { title: "Notificações e Alertas | Portal Pagadoria" },
      { name: "description", content: "Central de avisos automáticos sobre pendências, divergências e eventos críticos." },
      { property: "og:title", content: "Notificações e Alertas | Portal Pagadoria" },
      { property: "og:description", content: "Central de avisos automáticos sobre pendências, divergências e eventos críticos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AlertasPage,
});

function AlertasPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger />
          <h1 className="truncate text-sm font-semibold text-foreground">Notificações e Alertas</h1>
        </header>
        <ModuleStub
          title="Notificações e Alertas"
          description="Central de avisos automáticos sobre pendências, divergências, importações e eventos críticos."
          phase="Fase 5"
        />
      </div>
    </div>
  );
}
