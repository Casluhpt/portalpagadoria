import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Database,
  Sparkles,
  Wallet,
  Home,
  FileArchive,
  ShieldCheck,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Portal", url: "/", icon: Home, match: (p: string) => p === "/" },
  { title: "Principal", url: "/principal", icon: LayoutDashboard, match: (p: string) => p === "/principal" },
  { title: "Base", url: "/base", icon: Database, match: (p: string) => p === "/base" },
  { title: "Provisão Diária", url: "/provisao", icon: Wallet, match: (p: string) => p.startsWith("/provisao") },
  { title: "Anexos", url: "/anexos", icon: FileArchive, match: (p: string) => p.startsWith("/anexos") },
  { title: "Conciliação", url: "/conciliacao", icon: ShieldCheck, match: (p: string) => p.startsWith("/conciliacao") },
];

export function AppSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const { user } = useSession();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error(error.message);
    else toast.success("Sessão encerrada");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">Pagadoria</span>
            <span className="text-xs text-muted-foreground">Profarma</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.match(currentPath)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            {user ? (
              <div className="space-y-2 px-2 pb-2 group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-2 rounded-md bg-sidebar-accent/40 px-2 py-1.5 text-xs text-sidebar-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span className="truncate" title={user.email ?? ""}>{user.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </Button>
              </div>
            ) : (
              <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
                <Button asChild variant="default" size="sm" className="w-full">
                  <Link to="/auth">
                    <LogIn className="mr-2 h-4 w-4" /> Entrar para editar
                  </Link>
                </Button>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

