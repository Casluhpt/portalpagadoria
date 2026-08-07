import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import logoPagadoria from "@/assets/logo-pagadoria.png.asset.json";
import { AppLogo } from "./app-logo";
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
  BookOpen,
  ChevronRight,
  FileSpreadsheet,
  MessageSquare,
  Bot,
  X,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { ComponentType } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRoles, type AppRole } from "@/hooks/use-roles";
import { useProfile } from "@/hooks/use-profile";
import { useQuery } from "@tanstack/react-query";
import { fetchMateriais, materialApoioQueryKey } from "@/lib/material-apoio";
import { perguntarIa } from "@/lib/ia.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  group?: string;
};

const navigationGroups = [
  { id: "geral", label: "Navegação Geral" },
  { id: "operacao", label: "Operação e Resultados" },
  { id: "financeiro", label: "Financeiro e Controle" },
  { id: "base_anexos", label: "[anexo] e Relatórios" },
  { id: "apoio", label: "Suporte e IA" }
];

const mainItems: MenuItem[] = [
  { title: "Início", url: "/", icon: Home, match: (p: string) => p === "/", group: "geral" },
  
  { title: "Resultados Principais", url: "/principal", icon: LayoutDashboard, match: (p: string) => p.startsWith("/principal"), restricted: true, adminOnly: true, group: "operacao" },
  { title: "Provisão Diária", url: "/provisao", icon: Wallet, match: (p: string) => p.startsWith("/provisao"), restricted: true, adminOnly: true, group: "operacao" },
  
  { title: "Conciliação Bancária", url: "/conciliacao", icon: ShieldCheck, match: (p: string) => p.startsWith("/conciliacao"), restricted: true, adminOnly: true, group: "financeiro" },
  { title: "Pagamentos Diversos", url: "/pagamentos", icon: Banknote, match: (p: string) => p.startsWith("/pagamentos"), group: "financeiro" },
  { title: "Despesas Fixas", url: "/despesas-fixas", icon: Wallet, match: (p: string) => p.startsWith("/despesas-fixas"), group: "financeiro" },
  { title: "Controle E-Social", url: "/esocial", icon: FileSpreadsheet, match: (p: string) => p.startsWith("/esocial"), group: "financeiro" },

  { title: "[anexo]", url: "/anexos", icon: FileArchive, match: (p: string) => p.startsWith("/anexos"), group: "base_anexos" },
  { title: "Exportação de Relatórios", url: "/exportacao", icon: Download, match: (p: string) => p.startsWith("/exportacao"), group: "base_anexos" },

  { title: "Administração de Comunicados", url: "/administracao", icon: Settings, match: (p: string) => p.startsWith("/administracao"), adminOnly: true, group: "geral" },
  { title: "Fechamento de Competência", url: "/fechamento", icon: FileCheck2, match: (p: string) => p.startsWith("/fechamento"), group: "geral" },
  { title: "Central de Divergências", url: "/divergencias", icon: AlertTriangle, match: (p: string) => p.startsWith("/divergencias"), group: "geral" },

  { title: "Material de Apoio", url: "/material-apoio", icon: BookOpen, match: (p: string) => p.startsWith("/material-apoio"), group: "apoio" },
  { title: "Busca e IA", url: "#", icon: Sparkles, match: (p: string) => false, action: "search", group: "apoio" },

];

const advancedItems: MenuItem[] = [
  { title: "Auditoria", url: "/auditoria", icon: ScrollText, match: (p: string) => p === "/auditoria" || p === "/registros-excluidos", allowedRoles: ["administrador", "auditor"] },
];


const roleLabel: Record<AppRole, string> = {
  administrador: "Administração",
  criador_competencia: "Criador de Competência",
  operacional: "Operacional",
  consulta: "Consulta",
  auditor: "Auditor",
  viewer: "Visualizador",
  visitante: "Gerência/Visitante",
  gerente: "Gerente",
};

export function AppSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const { user } = useSession();
  const { roles, isAdmin, isGerente, isViewer, hasAny, loading: rolesLoading } = useRoles();
  const { setor } = useProfile();
  const { data: materiais = [] } = useQuery({
    queryKey: materialApoioQueryKey,
    queryFn: fetchMateriais,
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const pages = useMemo(() => {
    const all = [
      { title: "Início", url: "/" },
      { title: "Material de Apoio", url: "/material-apoio" },
      { title: "Resultados Principais", url: "/principal" },
      { title: "Provisão Diária", url: "/provisao" },
      { title: "[anexo]", url: "/anexos" },
      { title: "Conciliação Bancária", url: "/conciliacao" },
      { title: "Pagamentos Diversos", url: "/pagamentos" },
      { title: "Administração de Comunicados", url: "/administracao" },
      { title: "Fechamento de Competência", url: "/fechamento" },
      { title: "Central de Divergências", url: "/divergencias" },
      { title: "Despesas Fixas", url: "/despesas-fixas" },
      { title: "Exportação de Relatórios", url: "/exportacao" },
    ];
    return all;
  }, []);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    const contexto = [
      "MÓDULOS DO PORTAL: " + pages.map((p) => p.title).join("; "),
      ...materiais
        .filter((m) => m.publicado)
        .map((m) => `### ${m.titulo} (${m.categoria})\n${m.conteudo}`),
    ]
      .join("\n\n")
      .slice(0, 50_000);

    try {
      const { data: modulosDisponiveis } = await supabase.from("app_modules").select("key");
      const allowedModules = modulosDisponiveis?.map(m => m.key) || [];

      const r = await perguntarIa({ 
        data: { 
          pergunta: userMsg, 
          contexto,
          appState: {
            currentPath,
            setor: setor || undefined,
            roles: roles || [],
            allowedModules
          }
        } 
      });
      if (r.erro) {
         setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: r.erro },
        ]);
        toast.error(r.erro);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: r.resposta ?? "IA de Suporte da Pagadoria: Não encontrei material autorizado suficiente." },
        ]);
      }
    } catch (err) {
      console.error("Erro na IA Sidebar:", err);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "IA de Suporte da Pagadoria: Erro na conexão com o servidor. Tente novamente." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

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


    if (isAdmin || isGerente) return true;
    if (isViewer) return isViewerAllowed(item.url);
    if (item.adminOnly) return isAdmin || isGerente;
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
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, shiftKey: true }));
        } : undefined}

      >
        {item.action === "search" ? (
          <div className="flex items-center gap-2 cursor-pointer w-full">
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.title}</span>
            <Sparkles className="ml-auto h-3 w-3 text-violet-500" />
          </div>
        ) : (
          <Link to={item.url} className="flex items-center gap-2">
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.title}</span>
          </Link>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link 
          to="/" 
          className="flex items-center gap-2 px-2 py-3 rounded-md hover:bg-sidebar-accent/50 transition-colors"
        >
          <AppLogo area="sidebar" className="h-10 w-10" />
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">Portal Pagadoria</span>
            <span className="text-[10px] text-muted-foreground">Central de inteligência financeira</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {navigationGroups.map(group => {
          const groupItems = mainItems.filter(item => item.group === group.id && canSee(item));
          if (groupItems.length === 0) return null;
          
          return (
            <SidebarGroup key={group.id}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groupItems.map(renderItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        {(advancedItems.filter(canSee).length > 0 || isAdmin) && (
          <SidebarGroup>
            <SidebarGroupLabel>Governança & Sistema</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {advancedItems.filter(canSee).map(renderItem)}
                
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            {user ? (
              <div className="space-y-2 px-2 pb-2 group-data-[collapsible=icon]:hidden">
                <div className="flex items-center justify-between px-2 py-1 mb-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Sistema Online</span>
                  </div>
                  <span className="text-[9px] text-emerald-600/70 font-mono">v2.8.4</span>
                </div>
                <LiveClock />
                <div className="rounded-md bg-sidebar-accent/40 px-2 py-1.5 text-xs text-sidebar-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    <span className="truncate" title={user.email ?? ""}>
                      {user.user_metadata?.nome || user.user_metadata?.full_name || user.email}
                    </span>
                  </div>
                  <div className="mt-1 pl-5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {rolesLoading
                      ? "Carregando perfil…"
                      : primaryRole
                      ? (roleLabel as any)[primaryRole] || primaryRole
                      : "Sem perfil atribuído"}
                    {setor ? (
                      <span className="ml-1 normal-case text-sidebar-foreground/70">· {setor}</span>
                    ) : null}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full h-8 text-xs font-semibold" onClick={() => setConfirmSignOut(true)}>
                  <LogOut className="mr-2 h-3 w-3" /> Sair
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

      {/* O Chat suspenso foi transformado na Busca Global flutuante no __root.tsx */}
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
