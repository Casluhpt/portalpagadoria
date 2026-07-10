import { Link, useNavigate } from "@tanstack/react-router";
import { Circle, Cog, KeyRound, LogIn, LogOut, MinusCircle, Settings, User, Users, XCircle } from "lucide-react";
import { toast } from "sonner";

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
import { usePresence, type PresenceStatus } from "@/hooks/use-presence";

import { NotificationBell } from "./notification-bell";

const roleLabel: Record<string, string> = {
  administrador: "Administrador",
  criador_competencia: "Criador de Competência",
  operacional: "Operacional",
  consulta: "Consulta",
  auditor: "Auditor",
};

const presenceMeta: Record<PresenceStatus, { label: string; dot: string; Icon: typeof Circle }> = {
  online: { label: "Online", dot: "bg-emerald-500", Icon: Circle },
  ausente: { label: "Ausente", dot: "bg-amber-500", Icon: MinusCircle },
  offline: { label: "Offline", dot: "bg-slate-400", Icon: XCircle },
};

export function HeaderActions() {
  const { user } = useSession();
  const { roles, isAdmin } = useRoles();
  const { status, setStatus } = usePresence();
  const navigate = useNavigate();
  const primary = roles[0];

  const signOut = async () => {
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
    <div className="flex items-center gap-1">
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-9 gap-2 px-1.5 hover:bg-slate-100"
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
            <span className="hidden max-w-[140px] truncate text-xs font-medium text-slate-700 sm:inline">
              {user.email}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="truncate text-sm font-semibold">{user.email}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {primary ? roleLabel[primary] : "Sem perfil atribuído"}
              </span>
              <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden />
                {meta.label}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Status
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={status}
            onValueChange={(v) => setStatus(v as PresenceStatus)}
          >
            {(Object.keys(presenceMeta) as PresenceStatus[]).map((s) => {
              const m = presenceMeta[s];
              return (
                <DropdownMenuRadioItem key={s} value={s} className="gap-2">
                  <span className={`h-2 w-2 rounded-full ${m.dot}`} aria-hidden />
                  {m.label}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
