import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, BellOff, CheckCheck, Sparkles, X, Clock } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import {
  comunicadosQueryKey,
  fetchComunicados,
  marcarLido,
  marcarTodosLidos,
  excluirComunicadosPermanente,
  type Comunicado,
} from "@/lib/comunicados";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";

type LatestVersion = {
  versao: string;
  titulo: string;
  resumo: string | null;
  lancada_em: string;
  tipo: string;
};

async function fetchLatestVersion(): Promise<LatestVersion | null> {
  const { data, error } = await supabase
    .from("app_versions")
    .select("versao, titulo, resumo, lancada_em, tipo")
    .order("lancada_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data as LatestVersion) ?? null;
}

const dismissKey = (userId: string, versao: string) => `version_notif_dismissed:${userId}:${versao}`;

const rel = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return `${d} d`;
};

export function NotificationBell() {
  const { user } = useSession();
  const qc = useQueryClient();

  const [snoozeUntil, setSnoozeUntil] = useState<number | null>(() => {
    const val = typeof window !== "undefined" ? window.localStorage.getItem(`notif_snooze:${user?.id}`) : null;
    return val ? parseInt(val) : null;
  });

  const isSnoozed = snoozeUntil ? snoozeUntil > Date.now() : false;

  const handleSnooze = (hours: number | "forever") => {
    if (!user) return;
    let until = 0;
    if (hours === "forever") until = Date.now() + 100 * 365 * 24 * 60 * 60 * 1000;
    else until = Date.now() + hours * 60 * 60 * 1000;
    
    setSnoozeUntil(until);
    window.localStorage.setItem(`notif_snooze:${user.id}`, until.toString());
    toast.info(`Notificações silenciadas por ${hours === "forever" ? "sempre" : hours + "h"}`);
  };

  const clearSnooze = () => {
    if (!user) return;
    setSnoozeUntil(null);
    window.localStorage.removeItem(`notif_snooze:${user.id}`);
    toast.info("Notificações reativadas");
  };

  const { data: items = [] } = useQuery({
    queryKey: [...comunicadosQueryKey, user?.id ?? "anon"],
    queryFn: () => fetchComunicados(user?.id),
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const { data: latestVersion } = useQuery({
    queryKey: ["latest-app-version"],
    queryFn: fetchLatestVersion,
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const [versionDismissed, setVersionDismissed] = useState(true);
  useEffect(() => {
    if (!user || !latestVersion) return;
    const dismissed = typeof window !== "undefined"
      && window.localStorage.getItem(dismissKey(user.id, latestVersion.versao)) === "1";
    setVersionDismissed(dismissed);
  }, [user, latestVersion]);

  const dismissVersion = () => {
    if (!user || !latestVersion) return;
    window.localStorage.setItem(dismissKey(user.id, latestVersion.versao), "1");
    setVersionDismissed(true);
  };

  const showVersionCard = !!latestVersion && !versionDismissed;
  const naoLidos = useMemo(() => items.filter((i) => !i.lido), [items]);
  const totalBadge = naoLidos.length + (showVersionCard ? 1 : 0);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const markOne = useMutation({
    mutationFn: (id: string) => marcarLido(id, user!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: comunicadosQueryKey }),
  });

  const markAll = useMutation({
    mutationFn: () => marcarTodosLidos(naoLidos.map((n) => n.id), user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: comunicadosQueryKey });
      toast.success("Notificações marcadas como lidas");
    },
  });

  const deleteSelected = useMutation({
    mutationFn: () => excluirComunicadosPermanente(Array.from(selectedIds), user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: comunicadosQueryKey });
      setSelectedIds(new Set());
      toast.success("Notificações excluídas");
    },
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = (ids: string[]) => {
    if (selectedIds.size === ids.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(ids));
  };

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notificações${totalBadge ? ` (${totalBadge} não lidas)` : ""}`}
        >
          {isSnoozed ? (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Bell className="h-5 w-5 text-muted-foreground" />
          )}
          {totalBadge > 0 && !isSnoozed && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
              {totalBadge > 9 ? "9+" : totalBadge}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" collisionPadding={12} className="w-[calc(100vw-1.5rem)] max-w-96 p-0 sm:w-96 backdrop-blur-md bg-white/70 dark:bg-black/70 border-white/20 dark:border-white/10 shadow-2xl overflow-hidden rounded-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Notificações</p>
              {isSnoozed && (
                <span className="flex items-center gap-1 rounded bg-amber-100 dark:bg-amber-900/30 px-1 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400">
                  <BellOff className="h-2.5 w-2.5" /> Mudo
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {naoLidos.length > 0
                ? `${naoLidos.length} comunicado(s) não lido(s)`
                : "Nenhum comunicado não lido"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-1" side="bottom" align="end" collisionPadding={12}>
                <div className="grid gap-1">
                  <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Silenciar</p>
                  {isSnoozed ? (
                    <Button variant="ghost" className="justify-start h-8 text-xs font-medium text-indigo-600" onClick={clearSnooze}>
                      Tirar do silencioso
                    </Button>
                  ) : (
                    <>
                      <Button variant="ghost" className="justify-start h-8 text-xs" onClick={() => handleSnooze(4)}>4 horas</Button>
                      <Button variant="ghost" className="justify-start h-8 text-xs" onClick={() => handleSnooze(8)}>8 horas</Button>
                      <Button variant="ghost" className="justify-start h-8 text-xs" onClick={() => handleSnooze(12)}>12 horas</Button>
                      <Button variant="ghost" className="justify-start h-8 text-xs" onClick={() => handleSnooze("forever")}>Para sempre</Button>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {naoLidos.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
              </Button>
            )}
          </div>
        </div>
        {showVersionCard && latestVersion && (
          <div className="relative border-b border-violet-100/20 bg-gradient-to-r from-violet-50/50 to-indigo-50/50 dark:from-violet-950/20 dark:to-indigo-950/20 backdrop-blur-sm px-4 py-3">
            <button
              onClick={dismissVersion}
              aria-label="Dispensar novidade"
              className="absolute right-2 top-2 rounded-full p-1 text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-start gap-2 pr-6">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {latestVersion.versao}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                    Nova versão
                  </span>
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">
                  {latestVersion.titulo}
                </p>
                {latestVersion.resumo && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground dark:text-slate-300">{latestVersion.resumo}</p>
                )}
                <Link
                  to="/historico"
                  className="mt-1 inline-block text-[11px] font-medium text-violet-700 dark:text-violet-400 hover:underline"
                >
                  Ver histórico completo →
                </Link>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col">
          <Tabs defaultValue="unread" className="w-full">
            <TabsList className="mx-4 mt-2 grid w-[calc(100%-2rem)] grid-cols-2">
              <TabsTrigger value="unread" className="text-xs">
                Não lidas{naoLidos.length > 0 ? ` (${naoLidos.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs">
                Histórico
              </TabsTrigger>
            </TabsList>
            <TabsContent value="unread" className="mt-2">
              <NotifList 
                items={naoLidos} 
                emptyLabel="Nenhum comunicado não lido." 
                onMark={(id) => markOne.mutate(id)}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />
            </TabsContent>
            <TabsContent value="history" className="mt-2">
              <NotifList 
                items={items} 
                emptyLabel="Nenhum comunicado no histórico." 
                onMark={(id) => markOne.mutate(id)}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />
            </TabsContent>
          </Tabs>

          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2">
              <span className="text-[10px] font-medium text-muted-foreground">
                {selectedIds.size} selecionada(s)
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-[10px] hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => deleteSelected.mutate()}
                  disabled={deleteSelected.isPending}
                >
                  <Trash2 className="mr-1 h-3 w-3" /> Excluir
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-[10px]"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotifList({
  items,
  emptyLabel,
  onMark,
  selectedIds,
  onToggleSelect,
}: {
  items: Comunicado[];
  emptyLabel: string;
  onMark: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  return (
    <ScrollArea className="max-h-96">
      {items.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-muted-foreground">{emptyLabel}</div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((c) => (
            <li
              key={c.id}
              className={`group relative flex items-start gap-3 px-4 py-3 pr-9 text-sm transition-all duration-300 border-b border-border/50 last:border-0 ${
                selectedIds.has(c.id) 
                  ? "bg-violet-100/30 dark:bg-violet-900/20" 
                  : c.lido ? "bg-transparent" : "bg-violet-50/40 dark:bg-violet-950/10"
              }`}
            >
              <div className="mt-1 flex shrink-0 items-center gap-2">
                <Checkbox 
                  checked={selectedIds.has(c.id)} 
                  onCheckedChange={() => onToggleSelect(c.id)}
                  className="h-3.5 w-3.5 border-violet-300 dark:border-violet-700 data-[state=checked]:bg-violet-600 dark:data-[state=checked]:bg-violet-500"
                />
                <span
                  className={`h-2 w-2 rounded-full ${c.lido ? "bg-muted-foreground/40" : "bg-violet-600 dark:bg-violet-400"}`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-semibold text-foreground">{c.titulo}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{rel(c.criado_em)}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">
                  {c.mensagem}
                  {c.mensagem.includes("http") && (
                    <a 
                      href={c.mensagem.split(" ").find(w => w.startsWith("http"))} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-1 block font-medium text-violet-600 hover:underline"
                    >
                      Baixar arquivo agora
                    </a>
                  )}
                </p>
                {!c.lido && (
                  <button
                    className="mt-1 text-[11px] font-medium text-violet-700 hover:underline"
                    onClick={() => onMark(c.id)}
                  >
                    Marcar como lida
                  </button>
                )}
              </div>
              {!c.lido && (
                <button
                  onClick={() => onMark(c.id)}
                  aria-label="Fechar notificação"
                  className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100 focus:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </ScrollArea>
  );
}
