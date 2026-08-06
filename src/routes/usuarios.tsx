import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLogo } from "@/components/app-logo";
import { UsuariosTableWrapper } from "@/components/admin/usuarios-table";
import { Loader2, KeyRound, Search, ShieldCheck, Eye, UserPlus, Trash2, List, LayoutGrid } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Gestão de Usuários | Portal Pagadoria" },
      { name: "description", content: "Administre perfis, permissões e acessos de usuários ao sistema." },
      { property: "og:title", content: "Gestão de Usuários | Portal Pagadoria" },
      { property: "og:description", content: "Administre perfis, permissões e acessos de usuários ao sistema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UsuariosPage,
});

function UsuariosPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger />
          <Link to="/" className="flex flex-1 items-center gap-2 hover:opacity-80 transition-opacity">
            <AppLogo area="header" className="h-6 w-auto shrink-0 sm:h-7" />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-foreground">Administração de Usuários</h1>
              <p className="hidden truncate text-[10px] text-muted-foreground sm:block">Gestão de acessos e permissões</p>
            </div>
          </Link>
          <div className="ml-auto">
            <HeaderActions />
          </div>
        </header>
        <UsuariosContent />
      </div>
    </div>
  );
}

function UsuariosContent() {
  return (
    <UsuariosTableWrapper />
  );
}
