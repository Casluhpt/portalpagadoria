import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HeaderActions } from "@/components/header-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Calendar, Database, Edit2, RotateCcw, Save } from "lucide-react";
import { fetchFechamentosPagamentos, fechamentoPagamentosKey, type FechamentoPagamento } from "@/lib/fechamento-pagamentos";
import { useSession } from "@/hooks/use-session";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { updateFechamento, reabrirCompetencia } from "@/lib/fechamento-governance.functions";
import { logAcaoCritica } from "@/lib/audit-critico";

export const Route = createFileRoute("/fechamento")({
  component: FechamentoPage,
});

function FechamentoPage() {
  const { user } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (user) {
      import("@/integrations/supabase/client").then(({ supabase }) => {
        supabase.from("user_roles").select("role").eq("user_id", user.id).single()
          .then(({ data }) => setProfile(data));
      });
    }
  }, [user]);

  const isAdmin = profile?.role === "admin";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [reopenId, setReopenId] = useState<string | null>(null);
  const [justificativa, setJustificativa] = useState("");

  const updateFn = useServerFn(updateFechamento);
  const reabrirFn = useServerFn(reabrirCompetencia);

  const { data: fechamentos, isLoading } = useQuery({
    queryKey: fechamentoPagamentosKey,
    queryFn: fetchFechamentosPagamentos,
    enabled: !!user,
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: string; nome: string }) => updateFn({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fechamentoPagamentosKey });
      toast.success("Fechamento atualizado com sucesso");
      setEditingId(null);
      logAcaoCritica({
        acao: "edicao_pos_fechamento",
        modulo: "Fechamento de Competência",
        descricao: `Nome alterado para: ${variables.nome}`,
        severidade: "alerta",
      });
    },
    onError: () => toast.error("Erro ao atualizar fechamento"),
  });

  const reabrirMut = useMutation({
    mutationFn: (data: { id: string; justificativa: string }) => reabrirFn({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fechamentoPagamentosKey });
      toast.success("Competência reaberta com sucesso");
      setReopenId(null);
      setJustificativa("");
      logAcaoCritica({
        acao: "reabertura_competencia",
        modulo: "Fechamento de Competência",
        justificativa: variables.justificativa,
        severidade: "critico",
      });
    },
    onError: () => toast.error("Erro ao reabrir competência"),
  });

  const brl = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleEdit = (f: FechamentoPagamento) => {
    setEditingId(f.id);
    setEditNome(f.nome);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="truncate text-sm font-semibold text-foreground">Fechamento de Competência</h1>
            <div className="ml-auto">
              <HeaderActions />
            </div>
          </header>
          
          <main className="flex-1 space-y-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Histórico de Fechamentos</h2>
                <p className="text-sm text-muted-foreground">
                  {isAdmin 
                    ? "Cada fechamento gera um snapshot histórico independente. A competência original permanece disponível para usuários autorizados: alterações posteriores geram uma nova versão, sem sobrescrever versões anteriores, e ficam registradas em auditoria."
                    : "Consulta das competências encerradas. Cada versão histórica é preservada."}
                </p>
              </div>
              <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white font-bold shadow-lg transition-all duration-500 ${isAdmin ? 'bg-blue-600' : 'bg-slate-600'}`}>
                <Info className="h-5 w-5" />
                <span>
                  {isAdmin
                    ? "ACESSO ADMINISTRATIVO: EDIÇÃO PERMITIDA"
                    : "HISTÓRICO VERSIONADO — CONSULTA DISPONÍVEL"}
                </span>
              </div>
            </div>

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-xl" />
                ))}
              </div>
            ) : fechamentos && fechamentos.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {fechamentos.map((f) => (
                  <Card key={f.id} className="overflow-hidden border-emerald-100 hover:shadow-md transition-shadow group">
                    <CardHeader className="bg-emerald-50 py-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        {editingId === f.id ? (
                          <div className="flex w-full items-center gap-2">
                            <Input 
                              value={editNome} 
                              onChange={(e) => setEditNome(e.target.value)}
                              className="h-7 text-xs"
                              autoFocus
                            />
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 text-emerald-600"
                              onClick={() => updateMut.mutate({ id: f.id, nome: editNome })}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="truncate">{f.nome}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isAdmin && (
                                <>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-7 w-7 text-blue-600"
                                    onClick={() => handleEdit(f)}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-7 w-7 text-orange-600"
                                    onClick={() => setReopenId(f.id)}
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                              <Calendar className="h-4 w-4 text-emerald-600" />
                            </div>
                          </>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-muted-foreground font-semibold">Competência</p>
                          <p className="text-sm font-medium">{f.mes}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[10px] uppercase text-muted-foreground font-semibold">Valor Total</p>
                          <p className="text-sm font-bold text-emerald-700">{brl(f.total_valor)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-muted-foreground font-semibold">Registros</p>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Database className="h-3 w-3 text-muted-foreground" />
                            {f.total_registros} itens
                          </div>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[10px] uppercase text-muted-foreground font-semibold">Data Encerramento</p>
                          <p className="text-sm">{new Date(f.criado_em).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Database className="mb-4 h-12 w-12 opacity-20" />
                  <p>Nenhum fechamento registrado até o momento.</p>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>

      <Dialog open={!!reopenId} onOpenChange={() => setReopenId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabrir Competência</DialogTitle>
            <DialogDescription>
              Esta ação removerá o fechamento do histórico para permitir correções.
              Uma justificativa detalhada é obrigatória.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Descreva o motivo da reabertura (mínimo 10 caracteres)..."
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenId(null)}>Cancelar</Button>
            <Button 
              variant="destructive"
              disabled={justificativa.length < 10 || reabrirMut.isPending}
              onClick={() => reopenId && reabrirMut.mutate({ id: reopenId, justificativa })}
            >
              {reabrirMut.isPending ? "Processando..." : "Confirmar Reabertura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
