import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboard, ShieldAlert, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoles } from "@/hooks/use-roles";

export const Route = createFileRoute("/provisao")({
  head: () => ({
    meta: [
      { title: "Provisão Diária | Portal Pagadoria" },
      { name: "description", content: "Acompanhe e gerencie as provisões diárias da empresa profarma." },
      { property: "og:title", content: "Provisão Diária | Portal Pagadoria" },
      { property: "og:description", content: "Acompanhe e gerencie as provisões diárias da empresa profarma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProvisaoLayout,
});

function ProvisaoLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin, loading } = useRoles();
  const tabs = [
    { to: "/provisao", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/provisao/base", label: "Base da Provisão", icon: Table2, exact: false },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger />
          {isAdmin && (
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
          )}
        </header>
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Carregando…
          </div>
        ) : isAdmin ? (
          <Outlet />
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm">
              <ShieldAlert className="mx-auto h-10 w-10 text-amber-600" />
              <h2 className="mt-3 text-lg font-semibold text-foreground">
                Acesso restrito
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A Provisão Diária e a Base da Provisão são visíveis apenas para
                colaboradores com perfil <strong>Administrador</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
