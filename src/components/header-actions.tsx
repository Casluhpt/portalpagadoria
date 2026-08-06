import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";


import { Circle, Cog, History, KeyRound, LogIn, LogOut, Mail, MinusCircle, Settings, User, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
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

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/use-roles";
import { useSession } from "@/hooks/use-session";
import { useProfile } from "@/hooks/use-profile";
import { usePresence, type PresenceStatus } from "@/hooks/use-presence";

import { NotificationBell } from "./notification-bell";
import { GlobalSearch } from "./global-search";
import { ThemeMenuSection } from "./theme-toggle";
import { useEffect, useState } from "react";


const roleLabel: Record<string, string> = {
  administrador: "Administração",
  criador_competencia: "Criador de Competência",
  operacional: "Operacional",
  consulta: "Consulta",
  auditor: "Auditor",
  viewer: "Visualizador",
  visitante: "Gerência/Visitante",
};

const presenceMeta: Record<PresenceStatus, { label: string; dot: string; Icon: typeof Circle }> = {
  online: { label: "Online", dot: "bg-emerald-500", Icon: Circle },
  ausente: { label: "Ausente", dot: "bg-amber-500", Icon: MinusCircle },
  offline: { label: "Offline", dot: "bg-muted-foreground/60", Icon: XCircle },
};

export function HeaderActions() {
  const { user } = useSession();
  const { roles, isAdmin } = useRoles();
  const { setor } = useProfile();
  const { status, setStatus } = usePresence();
  // iaOnline state removed to clean up residual AI logic

  const navigate = useNavigate();
  const primary = roles[0];

  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const signOut = async () => {
    setConfirmSignOut(false);
    const { error } = await supabase.auth.signOut();
    if (error) toast.error(error.message);
    else toast.success("Sessão encerrada");
  };

  const sendPasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Enviamos um link de redefinição para seu email.");
  };

  // AI status fetching removed as part of AI cleanup to prevent errors and visual marks



  if (!user) {
    return (
      <Button asChild size="sm" variant="default">
        <Link to="/auth">
          <LogIn className="mr-2 h-4 w-4" /> Entrar
        </Link>
      </Button>
    );
  }

  const initials = (user.email ?? "?")
    .split("@")[0]
    .split(/[.\s_-]+/)
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  const meta = presenceMeta[status];

  return (
    <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
      {/* Status da IA - Removido indicador visual que causava marca no canto superior direito */}
      <div className="hidden lg:block">

        <GlobalSearch />
      </div>
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-9 gap-2 px-1.5 hover:bg-muted"
            aria-label="Perfil do usuário"
          >
            <div className="relative">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-[11px] font-semibold text-white">
                {initials || <User className="h-4 w-4" />}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${meta.dot}`}
                aria-label={meta.label}
              />
            </div>
            <span className="hidden max-w-[140px] truncate text-xs font-medium text-foreground sm:inline">
              {user.user_metadata?.nome || user.user_metadata?.full_name || user.email}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="truncate text-sm font-semibold">{user.user_metadata?.nome || user.user_metadata?.full_name || user.email}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {primary ? roleLabel[primary] : "Sem perfil atribuído"}
                {setor ? <span className="ml-1 normal-case text-muted-foreground">· {setor}</span> : null}
              </span>
              <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden />
                {meta.label}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[10px] text-muted-foreground pointer-events-none">
            <Mail className="mr-2 h-3.5 w-3.5" /> {user.email}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex h-10 items-center justify-between gap-4 px-2 py-0 text-[10px] uppercase tracking-wide text-muted-foreground">
              <span>Status</span>
              <span className="flex items-center gap-1.5 normal-case tracking-normal text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden />
                {meta.label}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuRadioGroup
                value={status}
                onValueChange={(v) => setStatus(v as PresenceStatus)}
              >
                {(Object.keys(presenceMeta) as PresenceStatus[]).map((s) => {
                  const m = presenceMeta[s];
                  return (
                    <DropdownMenuRadioItem key={s} value={s} className="gap-2 text-xs">
                      <span className={`h-2 w-2 rounded-full ${m.dot}`} aria-hidden />
                      {m.label}
                    </DropdownMenuRadioItem>
                  );
                })}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <ThemeMenuSection />
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Configurações">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Configurações
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={sendPasswordReset}>
            <KeyRound className="mr-2 h-4 w-4" /> Redefinir senha
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/configuracoes" })}>
            <Settings className="mr-2 h-4 w-4" /> Configurações
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => navigate({ to: "/usuarios" })}>
              <Users className="mr-2 h-4 w-4" /> Usuários
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setConfirmSignOut(true); }}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
            <AlertDialogAction onClick={signOut}>Sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
