import { Link } from "@tanstack/react-router";
import { Circle, LogIn, LogOut, MinusCircle, User, XCircle } from "lucide-react";
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

export function HeaderActions() {
  const { user } = useSession();
  const { roles } = useRoles();
  const primary = roles[0];

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error(error.message);
    else toast.success("Sessão encerrada");
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
            <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-[11px] font-semibold text-white">
              {initials || <User className="h-4 w-4" />}
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
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
