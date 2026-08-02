import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRoles } from "@/hooks/use-roles";
import {
  comunicadosQueryKey,
  fetchComunicados,
  publicarComunicado,
} from "@/lib/comunicados";

export const Route = createFileRoute("/administracao")({
  beforeLoad: async ({ context }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { returnTo: "/administracao" } });
    }
  },
  component: AdministracaoPage,
});

function AdministracaoPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold text-foreground">Administração de Comunicados</h1>
            <div className="ml-auto">
              <HeaderActions />
            </div>
          </header>
          <main className="flex-1 space-y-6 p-6">
            <ComunicadosPanel />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function ComunicadosPanel() {
  const { user } = useSession();
  const { isAdmin, loading } = useRoles();
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [canal, setCanal] = useState<"portal" | "email" | "ambos">("portal");

  const { data: items = [] } = useQuery({
    queryKey: [...comunicadosQueryKey, "admin"],
    queryFn: () => fetchComunicados(user?.id),
    enabled: !!user,
  });

  const publish = useMutation({
    mutationFn: () => publicarComunicado(titulo.trim(), mensagem.trim(), user!.id, canal),
    onSuccess: () => {
      toast.success("Comunicado publicado com sucesso");
      setTitulo("");
      setMensagem("");
      qc.invalidateQueries({ queryKey: comunicadosQueryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeBulk = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("comunicados").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comunicados removidos");
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: comunicadosQueryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return null;

  if (!isAdmin) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-start gap-3 p-6">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">Acesso restrito</p>
            <p className="text-sm text-amber-800">
              Apenas usuários com perfil <b>Administrador</b> podem publicar comunicados globais.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const canSubmit = titulo.trim().length > 2 && mensagem.trim().length > 2 && !publish.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4 text-violet-600" /> Publicar comunicado global
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Todos os colaboradores logados receberão a notificação no sino do topo.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              placeholder="Ex.: Atualização de calendário de pagamentos"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea
              id="mensagem"
              placeholder="Descreva a novidade, aviso ou orientação."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={6}
              maxLength={2000}
            />
          </div>
          <div className="space-y-2">
            <Label>Canal de envio</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="canal" checked={canal === "portal"} onChange={() => setCanal("portal")} />
                Somente Portal
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="canal" checked={canal === "email"} onChange={() => setCanal("email")} />
                Somente Email
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="canal" checked={canal === "ambos"} onChange={() => setCanal("ambos")} />
                Os dois
              </label>
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!canSubmit}
            onClick={() => publish.mutate()}
          >
            {publish.isPending ? "Publicando..." : "Publicar para todos"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Histórico de comunicados</CardTitle>
            <p className="text-xs text-muted-foreground">Últimos 100 comunicados publicados.</p>
          </div>
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => {
                if (confirm(`Remover ${selectedIds.size} comunicados selecionados?`)) {
                  removeBulk.mutate(Array.from(selectedIds));
                }
              }}
            >
              <Trash2 className="h-4 w-4" /> Excluir ({selectedIds.size})
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum comunicado publicado ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((c) => (
                <li key={c.id} className="flex items-start gap-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={(e) => {
                      const next = new Set(selectedIds);
                      if (e.target.checked) next.add(c.id);
                      else next.delete(c.id);
                      setSelectedIds(next);
                    }}
                    className="mt-1 h-4 w-4 rounded border-border"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{c.titulo}</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">
                      {c.mensagem}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(c.criado_em).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
