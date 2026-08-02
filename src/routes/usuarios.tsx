import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLogo } from "@/components/app-logo";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TechnicalSpec } from "@/components/technical-spec";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, KeyRound, Search, ShieldCheck, Eye, UserPlus, Trash2, List, LayoutGrid } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { RestrictedArea } from "@/components/role-gate";
import { logAcaoCritica } from "@/lib/audit-critico";
import { useSession } from "@/hooks/use-session";
import { useQueryClient } from "@tanstack/react-query";
import { listAdminUsers, resetUserPassword, setUserRole, setUserSetor, inviteUser, deleteUser, ALLOWED_SETORES, type AdminUserRow, type Setor } from "@/lib/admin-users.functions";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/usuarios")({
  component: UsuariosPage,
});

function UsuariosPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <Link to="/" className="flex flex-1 items-center gap-2 hover:opacity-80 transition-opacity">
              <AppLogo className="h-6 w-auto shrink-0 sm:h-7" />
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
    </SidebarProvider>
  );
}

import { UsuariosTableWrapper as UsuariosTable } from "@/components/admin/usuarios-table";

function UsuariosContent() {
  return (
    <UsuariosTable />
  );
}

function roleLabel(r: string) {
  switch (r) {
    case "administrador": return "Administração";
    case "auditor": return "Auditor";
    case "operacional": return "Operacional";
    case "criador_competencia": return "Criador de Competência";
    case "consulta": return "Consulta";
    case "viewer": return "Viewer";
    case "visitante": return "Gerência/Visitante";
    default: return r;
  }
}

function roleVariant(r: string): "default" | "secondary" | "outline" | "destructive" {
  if (r === "administrador") return "destructive";
  if (r === "auditor") return "default";
  if (r === "viewer") return "outline";
  return "secondary";
}

function UsuariosTable() {
  const listFn = useServerFn(listAdminUsers);
  const resetFn = useServerFn(resetUserPassword);
  const setRoleFn = useServerFn(setUserRole);
  const setSetorFn = useServerFn(setUserSetor);
  const inviteFn = useServerFn(inviteUser);
  const deleteFn = useServerFn(deleteUser);
  const qc = useQueryClient();
  const { user } = useSession();
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNome, setInviteNome] = useState("");
  const [inviteRole, setInviteRole] = useState<"administrador" | "viewer" | "visitante">("viewer");

  const { data = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listFn({}),
    staleTime: 60_000,
  });


  // Real-time presence updates are disabled as per project requirements
  /*
  useEffect(() => {
    const channel = supabase
      .channel("admin-users-presence")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          qc.invalidateQueries({ queryKey: ["admin-users"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
  */


  const resetMut = useMutation({
    mutationFn: (email: string) =>
      resetFn({ data: { email, redirectTo: `${window.location.origin}/reset-password` } }),
    onSuccess: () => toast.success("Email de redefinição enviado."),
    onError: (e: any) => toast.error(e?.message ?? "Falha ao enviar email"),
  });

  const roleMut = useMutation({
    mutationFn: (vars: { userId: string; role: "administrador" | "viewer" | "visitante" }) =>
      setRoleFn({ data: vars }),
    onSuccess: () => {
      toast.success("Perfil atualizado.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao atualizar perfil"),
  });

  const setorMut = useMutation({
    mutationFn: (vars: { userId: string; setor: Setor | null }) =>
      setSetorFn({ data: vars }),
    onSuccess: () => {
      toast.success("Setor atualizado.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao atualizar setor"),
  });

  const inviteMut = useMutation({
    mutationFn: (vars: { email: string; role: "administrador" | "viewer" | "visitante"; nome?: string }) =>
      inviteFn({ data: { ...vars, redirectTo: `${window.location.origin}/reset-password` } }),
    onSuccess: () => {
      toast.success("Convite enviado com sucesso.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setInviteOpen(false);
      setInviteEmail(""); setInviteNome(""); setInviteRole("viewer");
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao enviar convite"),
  });

  const deleteMut = useMutation({
    mutationFn: (userId: string) => deleteFn({ data: { userId } }),
    onSuccess: () => {
      toast.success("Conta excluída.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao excluir conta"),
  });

  const [viewMode, setViewMode] = useState<"ampla" | "setor">("ampla");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((u) =>
      [u.email, u.nome, u.setor, ...u.roles].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [data, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof data> = {};
    filtered.forEach((u) => {
      const s = u.setor || "Sem Setor";
      if (!groups[s]) groups[s] = [];
      groups[s].push(u);
    });
    return groups;
  }, [filtered]);

  const onlineCount = data.filter((u) => u.online).length;

  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      <TechnicalSpec className="mb-4" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {isLoading ? "Carregando…" : error ? "Erro ao carregar." :
              `${data.length} usuário(s) • ${onlineCount} online agora`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-md border bg-background p-1">
            <Button
              variant={viewMode === "ampla" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1 px-2"
              onClick={() => setViewMode("ampla")}
            >
              <List className="h-3.5 w-3.5" /> Visão Ampla
            </Button>
            <Button
              variant={viewMode === "setor" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1 px-2"
              onClick={() => setViewMode("setor")}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Por Setor
            </Button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, email, setor…"
              className="h-9 w-64 pl-8"
            />
          </div>
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-1 h-4 w-4" /> Convidar usuário
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
          </Button>
        </div>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar novo usuário</DialogTitle>
            <DialogDescription>
              Um email de convite será enviado com um link seguro para o novo usuário definir a senha.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email" type="email" autoComplete="email"
                value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="usuario@empresa.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="invite-nome">Nome (opcional)</Label>
              <Input
                id="invite-nome" value={inviteNome}
                onChange={(e) => setInviteNome(e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="space-y-1">
              <Label>Perfil</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "administrador" | "viewer" | "visitante")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> Viewer</span>
                  </SelectItem>
                  <SelectItem value="administrador">
                    <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Administração</span>
                  </SelectItem>
                  <SelectItem value="visitante">
                    <span className="inline-flex items-center gap-1"><UserPlus className="h-3 w-3" /> Visitante</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviteMut.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => inviteMut.mutate({ email: inviteEmail, role: inviteRole, nome: inviteNome })}
              disabled={inviteMut.isPending || !inviteEmail}
            >
              {inviteMut.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <UserPlus className="mr-1 h-4 w-4" />}
              Enviar convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative flex-1 overflow-auto rounded-lg border border-border bg-card">
        {viewMode === "ampla" ? (
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
              <tr>
                <th className="border-b border-border px-3 py-2 text-left font-semibold">Status</th>
                <th className="border-b border-border px-3 py-2 text-left font-semibold">Nome</th>
                <th className="border-b border-border px-3 py-2 text-left font-semibold">Email</th>
                <th className="border-b border-border px-3 py-2 text-left font-semibold">Perfis</th>
                <th className="border-b border-border px-3 py-2 text-left font-semibold">Setor</th>
                <th className="border-b border-border px-3 py-2 text-left font-semibold">Criado em</th>
                <th className="border-b border-border px-3 py-2 text-left font-semibold">Último acesso</th>
                <th className="border-b border-border px-3 py-2 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u: AdminUserRow) => (
                <UserTableRow key={u.id} u={u} user={user} roleMut={roleMut} setorMut={setorMut} deleteMut={deleteMut} resetMut={resetMut} />
              ))}
            </tbody>
          </table>
        ) : (
          <div className="space-y-8 p-4">
            {Object.entries(grouped).map(([setor, users]) => (
              <div key={setor} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <h3 className="font-bold text-foreground">{setor}</h3>
                  <Badge variant="secondary" className="text-[10px]">{users.length}</Badge>
                </div>
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="border-b border-border px-3 py-2 text-left font-semibold">Nome</th>
                      <th className="border-b border-border px-3 py-2 text-left font-semibold">Email</th>
                      <th className="border-b border-border px-3 py-2 text-left font-semibold">Perfis</th>
                      <th className="border-b border-border px-3 py-2 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: AdminUserRow) => (
                      <UserTableRow key={u.id} u={u} user={user} roleMut={roleMut} setorMut={setorMut} deleteMut={deleteMut} resetMut={resetMut} compact />
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function UserTableRow({ u, user, roleMut, setorMut, deleteMut, resetMut, compact }: any) {
  const isSelf = user?.id === u.id;
  const [pendingRole, setPendingRole] = useState<"administrador" | "viewer" | "visitante" | null>(null);
  const [justificativa, setJustificativa] = useState("");
  return (
    <tr className="hover:bg-muted/40">
      {!compact && (
        <td className="whitespace-nowrap border-b border-border px-3 py-2">
          {(() => {
            const map = {
              online: { label: "Online", color: "bg-emerald-500" },
              ausente: { label: "Ausente", color: "bg-amber-500" },
              offline: { label: "Offline", color: "bg-muted-foreground/40" },
            } as const;
            const m = map[u.presence as keyof typeof map] || map.offline;
            return (
              <span className="inline-flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${m.color}`} aria-hidden />
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </span>
            );
          })()}
        </td>
      )}
      <td className="border-b border-border px-3 py-2">{u.nome ?? "—"}</td>
      <td className="border-b border-border px-3 py-2 font-mono text-xs">{u.email ?? "—"}</td>
      <td className="border-b border-border px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {(() => {
            const current: "administrador" | "viewer" | "visitante" =
              u.roles.includes("administrador") ? "administrador" : u.roles.includes("visitante") ? "visitante" : "viewer";
            const otherRoles = u.roles.filter((r: any) => r !== "administrador" && r !== "viewer");
            return (
              <>
                <Select
                  value={current}
                  disabled={roleMut.isPending || isSelf}
                  onValueChange={(v) => {
                    if (v === current) return;
                    setJustificativa("");
                    setPendingRole(v as "administrador" | "viewer" | "visitante");
                  }}
                >
                  <SelectTrigger className="h-8 w-[160px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Administração
                      </span>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Viewer
                      </span>
                    </SelectItem>
                    <SelectItem value="visitante">
                      <span className="inline-flex items-center gap-1">
                        <UserPlus className="h-3 w-3" /> Visitante
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <AlertDialog open={!!pendingRole} onOpenChange={(o) => !o && setPendingRole(null)}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Alterar permissão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ação administrativa crítica. Informe a justificativa — ela será registrada
                        na trilha de auditoria com data, hora e usuário responsável.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-1.5">
                      <Label htmlFor={`just-${u.id}`} className="text-xs">Justificativa</Label>
                      <Input
                        id={`just-${u.id}`}
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.target.value)}
                        placeholder={`De ${roleLabel(current)} para ${pendingRole ? roleLabel(pendingRole) : ""}`}
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={justificativa.trim().length < 5}
                        onClick={() => {
                          const novo = pendingRole!;
                          roleMut.mutate({ userId: u.id, role: novo });
                          void logAcaoCritica({
                            acao: "alteracao_permissao",
                            modulo: "Administração de Usuários",
                            tabela: "user_roles",
                            registro_id: u.id,
                            descricao: `Permissão de ${u.email ?? u.id} alterada de ${roleLabel(current)} para ${roleLabel(novo)}`,
                            justificativa: justificativa.trim(),
                            metadata: { anterior: current, novo },
                            severidade: "critico",
                          });
                          setPendingRole(null);
                        }}
                      >
                        Confirmar alteração
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {otherRoles.map((r: any) => (
                  <Badge key={r} variant={roleVariant(r)}>{roleLabel(r)}</Badge>
                ))}
                {isSelf && (
                  <span className="text-[10px] text-muted-foreground">(você)</span>
                )}
              </>
            );
          })()}
        </div>
      </td>
      {!compact && (
        <>
          <td className="whitespace-nowrap border-b border-border px-3 py-2">
            <Select
              value={u.setor ?? ""}
              disabled={setorMut.isPending}
              onValueChange={(v) =>
                setorMut.mutate({ userId: u.id, setor: v as Setor })
              }
            >
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {ALLOWED_SETORES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </td>
          <td className="whitespace-nowrap border-b border-border px-3 py-2 text-xs text-muted-foreground">
            {u.criado_em ? format(new Date(u.criado_em), "dd/MM/yy HH:mm", { locale: ptBR }) : "—"}
          </td>
          <td className="whitespace-nowrap border-b border-border px-3 py-2 text-xs text-muted-foreground">
            {u.last_seen ? formatDistanceToNow(new Date(u.last_seen), { locale: ptBR, addSuffix: true }) : "—"}
          </td>
        </>
      )}
      <td className="whitespace-nowrap border-b border-border px-3 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Redefinir senha">
                <KeyRound className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Redefinir senha?</AlertDialogTitle>
                <AlertDialogDescription>
                  Um email será enviado para <b>{u.email}</b> com as instruções.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => resetMut.mutate(u.email!)}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {!isSelf && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" title="Excluir conta">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A conta de <b>{u.nome || u.email}</b> será removida do sistema.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteMut.mutate(u.id)} className="bg-destructive hover:bg-destructive/90 text-white">
                    Excluir Usuário
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </td>
    </tr>
  );
}
