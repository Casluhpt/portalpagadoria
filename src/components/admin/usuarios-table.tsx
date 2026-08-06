import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, KeyRound, Search, ShieldCheck, Eye, UserPlus, Trash2, List, LayoutGrid, Edit2, CheckCircle2, X, User, ScrollText } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
import { listAdminUsers, resetUserPassword, setUserRole, setUserSetor, setUserNome, inviteUser, deleteUser, ALLOWED_SETORES, type AdminUserRow, type Setor, type AppRole, getAppModules, getUserModules, toggleUserModule, getUserSpecificPermissions, setUserSpecificPermission, removeUserSpecificPermission } from "@/lib/admin-users.functions";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function UsuariosTableWrapper() {
  return (
    <RestrictedArea area="Administração de Usuários" anyOf={["administrador", "gerente"]}>
      <UsuariosTable />
    </RestrictedArea>
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
  const [selectedUserForRBAC, setSelectedUserForRBAC] = useState<AdminUserRow | null>(null);
  const listFn = useServerFn(listAdminUsers);
  const resetFn = useServerFn(resetUserPassword);
  const setRoleFn = useServerFn(setUserRole);
  const setSetorFn = useServerFn(setUserSetor);
  const setNomeFn = useServerFn(setUserNome);
  const inviteFn = useServerFn(inviteUser);
  const deleteFn = useServerFn(deleteUser);
  const qc = useQueryClient();
  const { user } = useSession();
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNome, setInviteNome] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("viewer");

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
    mutationFn: (vars: { userId: string; role: AppRole }) =>
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

  const nomeMut = useMutation({
    mutationFn: (vars: { userId: string; nome: string | null }) =>
      setNomeFn({ data: vars }),
    onSuccess: () => {
      toast.success("Nome atualizado.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao atualizar nome"),
  });

  const inviteMut = useMutation({
    mutationFn: (vars: { email: string; role: AppRole; nome?: string }) =>
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
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> Viewer</span>
                  </SelectItem>
                  <SelectItem value="administrador">
                    <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Administração</span>
                  </SelectItem>
                  <SelectItem value="gerente">
                    <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> Gerente</span>
                  </SelectItem>
                  <SelectItem value="auditor">
                    <span className="inline-flex items-center gap-1"><ScrollText className="h-3 w-3" /> Auditor</span>
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

      <div className="flex-1 overflow-auto">
        {viewMode === "ampla" ? (
          <div className="grid grid-cols-1 gap-4 p-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((u: AdminUserRow) => (
              <UserCard 
                key={u.id} 
                u={u} 
                user={user} 
                roleMut={roleMut} 
                setorMut={setorMut} 
                nomeMut={nomeMut} 
                deleteMut={deleteMut} 
                resetMut={resetMut} 
                setSelectedUserForRBAC={setSelectedUserForRBAC} 
              />
            ))}
          </div>
        ) : (
          <div className="space-y-8 p-1">
            {Object.entries(grouped).map(([setor, users]) => (
              <div key={setor} className="space-y-4">
                <div className="flex items-center gap-3 border-b border-border/60 pb-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                  <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">{setor}</h3>
                  <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 border-none text-[10px] px-2 h-4">{users.length} usuários</Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {users.map((u: AdminUserRow) => (
                    <UserCard 
                      key={u.id} 
                      u={u} 
                      user={user} 
                      roleMut={roleMut} 
                      setorMut={setorMut} 
                      nomeMut={nomeMut} 
                      deleteMut={deleteMut} 
                      resetMut={resetMut} 
                      setSelectedUserForRBAC={setSelectedUserForRBAC} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedUserForRBAC && (
        <RBACManagerDialog 
          user={selectedUserForRBAC} 
          open={!!selectedUserForRBAC} 
          onOpenChange={(open) => !open && setSelectedUserForRBAC(null)} 
        />
      )}
    </div>
  );
}
function UserCard({ u, user, roleMut, setorMut, nomeMut, deleteMut, resetMut, setSelectedUserForRBAC }: any) {
  const isSelf = user?.id === u.id;
  const [pendingRole, setPendingRole] = useState<AppRole | null>(null);
  const [justificativa, setJustificativa] = useState("");
  const [editingNome, setEditingNome] = useState(false);
  const [tempNome, setTempNome] = useState(u.nome || "");

  const handleSaveNome = () => {
    if (tempNome === u.nome) {
      setEditingNome(false);
      return;
    }
    nomeMut.mutate({ userId: u.id, nome: tempNome.trim() || null });
    setEditingNome(false);
  };

  const statusMap = {
    online: { label: "Online", color: "bg-emerald-500", shadow: "shadow-[0_0_8px_rgba(16,185,129,0.5)]" },
    ausente: { label: "Ausente", color: "bg-amber-500", shadow: "shadow-[0_0_8px_rgba(245,158,11,0.5)]" },
    offline: { label: "Offline", color: "bg-muted-foreground/30", shadow: "" },
  } as const;
  
  const status = statusMap[u.presence as keyof typeof statusMap] || statusMap.offline;

  return (
    <div className={cn(
      "group relative flex flex-col gap-4 rounded-xl border border-border/50 bg-card/40 p-5 transition-all duration-300 hover:border-indigo-500/30 hover:bg-card/60 hover:shadow-lg hover:shadow-indigo-500/5 backdrop-blur-sm",
      isSelf && "ring-1 ring-indigo-500/20 bg-indigo-500/[0.02]"
    )}>
      {/* Header: User Info & Presence */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20">
              <User className="h-5 w-5 text-indigo-600/80" />
            </div>
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
              status.color,
              status.shadow
            )} title={status.label} />
          </div>
          
          <div className="min-w-0 space-y-0.5">
            {editingNome ? (
              <div className="flex items-center gap-1">
                <Input 
                  value={tempNome} 
                  onChange={(e) => setTempNome(e.target.value)}
                  className="h-7 text-xs py-0 px-2 min-w-[120px]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNome();
                    if (e.key === 'Escape') {
                      setTempNome(u.nome || "");
                      setEditingNome(false);
                    }
                  }}
                />
                <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-600 hover:bg-emerald-50" onClick={handleSaveNome}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-rose-50" onClick={() => {
                  setTempNome(u.nome || "");
                  setEditingNome(false);
                }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div 
                className="flex items-center gap-1.5 group/name cursor-pointer" 
                onClick={() => !isSelf && setEditingNome(true)}
              >
                <span className="truncate text-sm font-bold tracking-tight text-foreground">
                  {u.nome ?? "Sem nome"}
                </span>
                {!isSelf && (
                  <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover/name:opacity-100" />
                )}
              </div>
            )}
            <p className="truncate text-[10px] font-medium text-muted-foreground">{u.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-indigo-600 hover:bg-indigo-50"
            onClick={() => setSelectedUserForRBAC(u)}
            title="Gestão Granular"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" title="Redefinir Senha">
                <KeyRound className="h-3.5 w-3.5" />
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
                <AlertDialogAction onClick={() => resetMut.mutate(u.email!)}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {!isSelf && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-rose-50" title="Excluir Usuário">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">Excluir permanentemente?</AlertDialogTitle>
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
      </div>

      {/* Role & Sector Selectors */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">Perfil de Acesso</label>
          {(() => {
            const current = (u.roles.includes("administrador") 
              ? "administrador" 
              : u.roles.includes("gerente")
                ? "gerente"
                : u.roles.includes("visitante")
                  ? "visitante"
                  : "viewer") as AppRole;
            
            return (
              <>
                <Select
                  value={current}
                  disabled={roleMut.isPending || isSelf}
                  onValueChange={(v) => {
                    if (v === current) return;
                    setJustificativa("");
                    setPendingRole(v as AppRole);
                  }}
                >
                  <SelectTrigger className="h-8 w-full border-border/40 bg-background/50 text-[11px] font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administração</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="visitante">Visitante</SelectItem>
                  </SelectContent>
                </Select>
                <AlertDialog open={!!pendingRole} onOpenChange={(o) => !o && setPendingRole(null)}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Alterar permissão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ação administrativa crítica. Informe a justificativa.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                      <Label htmlFor={`just-${u.id}`} className="text-xs">Justificativa</Label>
                      <Input
                        id={`just-${u.id}`}
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.target.value)}
                        placeholder="Ex: Mudança de cargo/departamento"
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
                            descricao: `Perfil de ${u.email} alterado para ${novo}`,
                            justificativa: justificativa.trim(),
                            metadata: { anterior: current, novo },
                            severidade: "critico",
                          });
                          setPendingRole(null);
                        }}
                      >
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            );
          })()}
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">Setor</label>
          <Select
            value={u.setor ?? ""}
            disabled={setorMut.isPending}
            onValueChange={(v) => setorMut.mutate({ userId: u.id, setor: v as Setor })}
          >
            <SelectTrigger className="h-8 w-full border-border/40 bg-background/50 text-[11px] font-medium">
              <SelectValue placeholder="Definir setor" />
            </SelectTrigger>
            <SelectContent>
              {ALLOWED_SETORES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Footer: Metadata Tags */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {u.roles.filter((r: any) => !["administrador", "viewer", "visitante", "gerente"].includes(r)).map((r: any) => (
          <Badge key={r} variant="outline" className="h-4 border-indigo-500/20 bg-indigo-500/[0.03] px-1.5 text-[9px] font-bold uppercase text-indigo-600/70">
            {roleLabel(r)}
          </Badge>
        ))}
        {isSelf && (
          <Badge variant="outline" className="h-4 border-amber-500/20 bg-amber-500/[0.03] px-1.5 text-[9px] font-bold uppercase text-amber-600/70">
            Minha Conta
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-2 text-[9px] text-muted-foreground/60 font-medium italic">
          <span>Criado {u.criado_em ? format(new Date(u.criado_em), "dd/MM/yy", { locale: ptBR }) : "—"}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>Acesso {u.last_seen ? formatDistanceToNow(new Date(u.last_seen), { locale: ptBR, addSuffix: true }) : "—"}</span>
        </div>
      </div>
    </div>
  );
}

function RBACManagerDialog({ user, open, onOpenChange }: { user: AdminUserRow, open: boolean, onOpenChange: (open: boolean) => void }) {
  const fetchModules = useServerFn(getAppModules);
  const fetchUserModules = useServerFn(getUserModules);
  const fetchUserPerms = useServerFn(getUserSpecificPermissions);
  const toggleModuleFn = useServerFn(toggleUserModule);
  const setPermFn = useServerFn(setUserSpecificPermission);
  const removePermFn = useServerFn(removeUserSpecificPermission);

  const { data: modules, isLoading: loadingModules } = useQuery({ 
    queryKey: ["app-modules"], 
    queryFn: () => fetchModules() 
  });

  const { data: userModules, isLoading: loadingUserModules, refetch: refetchUserModules } = useQuery({ 
    queryKey: ["user-modules", user.id], 
    queryFn: () => fetchUserModules({ data: user.id }) 
  });

  const { data: userPerms, isLoading: loadingUserPerms, refetch: refetchUserPerms } = useQuery({ 
    queryKey: ["user-permissions", user.id], 
    queryFn: () => fetchUserPerms({ data: user.id }) 
  });

  const handleToggleModule = async (moduleId: string, enabled: boolean) => {
    try {
      await toggleModuleFn({ data: { userId: user.id, moduleId, enabled } });
      refetchUserModules();
      toast.success(enabled ? "Módulo ativado" : "Módulo desativado");
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    }
  };

  const handleSetPermission = async (resource: string, action: string, isAllowed: boolean | null) => {
    try {
      if (isAllowed === null) {
        await removePermFn({ data: { userId: user.id, resource, action } });
        toast.success("Permissão restaurada ao padrão");
      } else {
        await setPermFn({ data: { userId: user.id, resource, action, isAllowed } });
        toast.success(isAllowed ? "Permissão concedida" : "Permissão negada");
      }
      refetchUserPerms();
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    }
  };

  const isLoading = loadingModules || loadingUserModules || loadingUserPerms;

  const RESOURCES = [
    { id: "pagamentos", label: "Pagamentos Diversos" },
    { id: "provisao", label: "Provisão Diária" },
    { id: "esocial", label: "eSocial" },
    { id: "configuracoes", label: "Configurações" },
    { id: "auditoria", label: "Auditoria" },
    { id: "aprovacao", label: "Processo de Aprovação" }
  ];

  const ACTIONS = [
    { id: "read", label: "Visualizar" },
    { id: "write", label: "Criar/Editar" },
    { id: "delete", label: "Excluir" },
    { id: "admin", label: "Gerenciar" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            Gestão de Acessos: {user.nome || user.email}
          </DialogTitle>
          <DialogDescription>
            Controle granular de módulos e permissões específicas para este usuário.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="modules">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Módulos Visíveis (Menu Lateral)
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {modules?.map((m: any) => {
                    const isEnabled = userModules?.includes(m.id);
                    return (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                        <div className="space-y-0.5">
                          <span className="text-sm font-medium">{m.name}</span>
                          <p className="text-[10px] text-muted-foreground">{m.description}</p>
                        </div>
                        <Switch 
                          checked={isEnabled} 
                          onCheckedChange={(val) => handleToggleModule(m.id, val)}
                          className="data-[state=checked]:bg-indigo-600"
                        />
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="permissions">
              <AccordionTrigger className="text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Permissões Granulares (Ações)
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-6">
                  {RESOURCES.map((res) => (
                    <div key={res.id} className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-l-2 border-indigo-500 pl-2">
                        {res.label}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ACTIONS.map((act) => {
                          const override = userPerms?.find((p: any) => p.resource === res.id && p.action === act.id);
                          const status = override === undefined ? "default" : override.is_allowed ? "allowed" : "denied";

                          return (
                            <div key={act.id} className="flex items-center justify-between p-2 rounded border bg-background text-xs">
                              <span className="font-medium">{act.label}</span>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant={status === "default" ? "secondary" : "ghost"}
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={() => handleSetPermission(res.id, act.id, null)}
                                >
                                  Padrão
                                </Button>
                                <Button 
                                  variant={status === "allowed" ? "default" : "outline"}
                                  size="sm"
                                  className={cn("h-6 px-2 text-[10px]", status === "allowed" && "bg-green-600 hover:bg-green-700")}
                                  onClick={() => handleSetPermission(res.id, act.id, true)}
                                >
                                  Sim
                                </Button>
                                <Button 
                                  variant={status === "denied" ? "destructive" : "outline"}
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={() => handleSetPermission(res.id, act.id, false)}
                                >
                                  Não
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 rounded-lg bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30">
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                    <strong>Nota:</strong> Estas configurações sobrescrevem as permissões padrão do cargo. Se um cargo não tem permissão para excluir, mas você marcar "Sim" aqui, este usuário terá a permissão concedida individualmente.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
