import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Banknote,
  Settings,
  FileCheck2,
  AlertTriangle,
  Download,
  BarChart3,
  History,
  ScrollText,
  Trash2,
  Cog,
  Users,
  Lock,
  Clock,
  Search,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { ComponentType } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRoles, type AppRole } from "@/hooks/use-roles";
import { useProfile } from "@/hooks/use-profile";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type MenuItem = {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  match: (p: string) => boolean;
  adminOnly?: boolean;
  restricted?: boolean;
  allowedRoles?: AppRole[];
  action?: "search";
};

const mainItems: MenuItem[] = [
  { title: "Início", url: "/", icon: Home, match: (p) => p === "/" },
  { title: "Resultados Principais", url: "/principal", icon: LayoutDashboard, match: (p) => p === "/principal", restricted: true, adminOnly: true },
  { title: "Provisão Diária", url: "/provisao", icon: Wallet, match: (p) => p === "/provisao", restricted: true, adminOnly: true },
  { title: "Base de Anexos", url: "/anexos", icon: FileArchive, match: (p) => p.startsWith("/anexos") },
  { title: "Conciliação Bancária", url: "/conciliacao", icon: ShieldCheck, match: (p) => p.startsWith("/conciliacao"), restricted: true, adminOnly: true },
  { title: "Pagamentos Diversos", url: "/pagamentos", icon: Banknote, match: (p) => p.startsWith("/pagamentos") },
  { title: "Administração de Comunicados", url: "/administracao", icon: Settings, match: (p) => p.startsWith("/administracao"), adminOnly: true },
  { title: "Fechamento de Competência", url: "/fechamento", icon: FileCheck2, match: (p) => p.startsWith("/fechamento") },
  { title: "Central de Divergências", url: "/divergencias", icon: AlertTriangle, match: (p) => p.startsWith("/divergencias") },
  { title: "Despesas Fixas", url: "/despesas-fixas", icon: Wallet, match: (p) => p.startsWith("/despesas-fixas") },
  { title: "Exportação de Relatórios", url: "/exportacao", icon: Download, match: (p) => p.startsWith("/exportacao") },
  { title: "Busca Inteligente (IA)", url: "#", icon: Search, match: () => false, action: "search" },
];

const advancedItems: MenuItem[] = [
  { title: "Dashboard Gerencial", url: "/dashboard-gerencial", icon: BarChart3, match: (p) => p === "/dashboard-gerencial" },
  { title: "Auditoria", url: "/auditoria", icon: ScrollText, match: (p) => p === "/auditoria" || p === "/registros-excluidos", allowedRoles: ["administrador", "auditor"] },
];

const settingItems: MenuItem[] = [
  { title: "Administração de usuários", url: "/usuarios", icon: Users, match: (p) => p === "/usuarios", adminOnly: true },
  { title: "Histórico de versões", url: "/historico", icon: History, match: (p) => p === "/historico", adminOnly: true },
  { title: "Configurações Técnicas", url: "/configuracoes", icon: Cog, match: (p) => p === "/configuracoes", adminOnly: true },
];

const roleLabel: Record<AppRole, string> = {
  administrador: "Administração",
  criador_competencia: "Criador de Competência",
  operacional: "Operacional",
  consulta: "Consulta",
  auditor: "Auditor",
  viewer: "Visualizador",
  visitante: "Visitante",
};

export function AppSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const { user } = useSession();
  const { roles, isAdmin, isViewer, hasAny, loading: rolesLoading } = useRoles();
  const { setor } = useProfile();

  // Viewer users have access to a limited set of routes.
  const VIEWER_ALLOWED = ["/pagamentos", "/divergencias"];
  const isViewerAllowed = (path: string) =>
    VIEWER_ALLOWED.some((p) => path === p || path.startsWith(p + "/"));

  useEffect(() => {
    if (rolesLoading) return;
    if (isViewer && !isViewerAllowed(currentPath) && currentPath !== "/auth") {
      navigate({ to: "/pagamentos", replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isViewer, rolesLoading, currentPath, navigate]);

  const canSee = (item: MenuItem): boolean => {
    if (isViewer) return isViewerAllowed(item.url);
    if (item.adminOnly) return isAdmin;
    if (item.allowedRoles && item.allowedRoles.length > 0) return hasAny(item.allowedRoles);
    return true;
  };

  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const handleSignOut = async () => {
    setConfirmSignOut(false);
    const { error } = await supabase.auth.signOut();
    if (error) toast.error(error.message);
    else toast.success("Sessão encerrada");
  };

  const primaryRole = roles[0];

  const renderItem = (item: MenuItem) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton 
        asChild={item.action !== "search"} 
        isActive={item.match(currentPath)} 
        tooltip={item.title}
        onClick={item.action === "search" ? () => {
          const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true });
          document.dispatchEvent(event);
        } : undefined}
      >
        {item.action === "search" ? (
          <div className="flex items-center gap-2 cursor-pointer w-full">
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.title}</span>
            <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
              ⌘K
            </kbd>
          </div>
        ) : (
          <Link to={item.url} className="flex items-center gap-2">
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.title}</span>
            {item.restricted && (
              <Lock className="ml-auto h-3 w-3 shrink-0 text-amber-500" aria-label="Área restrita" />
            )}
          </Link>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 px-2 py-3 rounded-md hover:bg-sidebar-accent/50 transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">Pagadoria</span>
            <span className="text-xs text-muted-foreground">Portal Corporativo</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.filter(canSee).map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(advancedItems.filter(canSee).length > 0 || isAdmin) && (
          <SidebarGroup>
            <SidebarGroupLabel>Governança & Sistema</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {advancedItems.filter(canSee).map(renderItem)}
                
                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={currentPath.startsWith("/configuracoes")} tooltip="Configurações">
                      <Link to="/configuracoes">
                        <Settings className="h-4 w-4 shrink-0" />
                        <span>Configurações</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            {user ? (
              <div className="space-y-2 px-2 pb-2 group-data-[collapsible=icon]:hidden">
                <LiveClock />
                <div className="rounded-md bg-sidebar-accent/40 px-2 py-1.5 text-xs text-sidebar-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    <span className="truncate" title={user.email ?? ""}>{user.email}</span>
                  </div>
                  <div className="mt-1 pl-5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {rolesLoading
                      ? "Carregando perfil…"
                      : primaryRole
                      ? roleLabel[primaryRole]
                      : "Sem perfil atribuído"}
                    {setor ? (
                      <span className="ml-1 normal-case text-sidebar-foreground/70">· {setor}</span>
                    ) : null}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setConfirmSignOut(true)}>
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </Button>
              </div>
            ) : (
              <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
                <Button asChild variant="default" size="sm" className="w-full">
                  <Link to="/auth">
                    <LogIn className="mr-2 h-4 w-4" /> Entrar
                  </Link>
                </Button>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <AlertDialog open={confirmSignOut} onOpenChange={setConfirmSignOut}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Você será desconectado e precisará entrar novamente para acessar o portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut}>Sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}

function LiveClock() {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const data = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return (
    <div className="flex items-center gap-2 rounded-md bg-sidebar-accent/40 px-2 py-1.5 text-xs text-sidebar-foreground">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      <span className="tabular-nums">{data} · {hora}</span>
    </div>
  );
}
