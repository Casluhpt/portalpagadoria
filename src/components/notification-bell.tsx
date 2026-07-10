import { useMemo } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSession } from "@/hooks/use-session";
import {
  comunicadosQueryKey,
  fetchComunicados,
  marcarLido,
  marcarTodosLidos,
  type Comunicado,
} from "@/lib/comunicados";

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

  const { data: items = [] } = useQuery({
    queryKey: [...comunicadosQueryKey, user?.id ?? "anon"],
    queryFn: () => fetchComunicados(user?.id),
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const naoLidos = useMemo(() => items.filter((i) => !i.lido), [items]);

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

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notificações${naoLidos.length ? ` (${naoLidos.length} não lidas)` : ""}`}
        >
          <Bell className="h-5 w-5 text-slate-600" />
          {naoLidos.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
              {naoLidos.length > 9 ? "9+" : naoLidos.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Notificações</p>
            <p className="text-[11px] text-slate-500">
              {naoLidos.length > 0
                ? `${naoLidos.length} comunicado(s) não lido(s)`
                : "Nenhum comunicado não lido"}
            </p>
          </div>
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
            <NotifList items={naoLidos} emptyLabel="Nenhum comunicado não lido." onMark={(id) => markOne.mutate(id)} />
          </TabsContent>
          <TabsContent value="history" className="mt-2">
            <NotifList items={items} emptyLabel="Nenhum comunicado no histórico." onMark={(id) => markOne.mutate(id)} />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

function NotifList({
  items,
  emptyLabel,
  onMark,
}: {
  items: Comunicado[];
  emptyLabel: string;
  onMark: (id: string) => void;
}) {
  return (
    <ScrollArea className="max-h-96">
      {items.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-slate-500">{emptyLabel}</div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((c) => (
            <li
              key={c.id}
              className={`group relative flex gap-3 px-4 py-3 pr-9 text-sm ${c.lido ? "bg-white" : "bg-violet-50/60"}`}
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${c.lido ? "bg-slate-300" : "bg-violet-600"}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-semibold text-slate-900">{c.titulo}</p>
                  <span className="shrink-0 text-[10px] text-slate-400">{rel(c.criado_em)}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-xs text-slate-600">{c.mensagem}</p>
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
                  className="absolute right-2 top-2 rounded-full p-1 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 focus:opacity-100"
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
