import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboard, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/provisao")({
  component: ProvisaoLayout,
});

function ProvisaoLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tabs = [
    { to: "/provisao", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/provisao/base", label: "Base da Provisão", icon: Table2, exact: false },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              {tabs.map((t) => {
                const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
                return (
                  <Link
                    key={t.to}
                    to={t.to}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </Link>
                );
              })}
            </div>
          </header>
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
}
