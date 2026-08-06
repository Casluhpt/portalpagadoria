import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  History,
  FileText,
  Users,
  LayoutDashboard,
  Wallet,
  Banknote,
  ShieldCheck,
  FileSpreadsheet,
  Settings,
  AlertTriangle,
  Download,
  ScrollText,
  BarChart3,
  Loader2,

  Building2,
  Truck,
  CalendarRange,
  BookOpen,
  UserRound,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useRoles } from "@/hooks/use-roles";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { buscarNoPortal, type PortalHit } from "@/lib/portal-search";
import { fetchMateriais, materialApoioQueryKey } from "@/lib/material-apoio";


const RECENT_SEARCHES_KEY = "global_search_history";

const grupoIcon: Record<PortalHit["grupo"], typeof Users> = {
  "Usuários": UserRound,
  Colaboradores: Users,
  Empresas: Building2,
  Fornecedores: Truck,
  "Competências": CalendarRange,
  "Despesas Fixas": Wallet,
  "Material de Apoio": BookOpen,
};

export function GlobalSearch({ variant = "compact" }: { variant?: "compact" | "hero" }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  const navigate = useNavigate();
  const { isAdmin, hasAny } = useRoles();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Alterado para Ctrl + Shift + K para manter consistência com outros atalhos
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        /* ignora */
      }
    }
  }, []);

  const saveToHistory = useCallback(
    (term: string) => {
      if (!term.trim()) return;
      const next = [term, ...history.filter((h) => h !== term)].slice(0, 5);
      setHistory(next);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    },
    [history],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  const termoDebounced = useDebounced(search, 350);

  const { data: hits = [], isFetching } = useQuery({
    queryKey: ["portal-search", termoDebounced],
    queryFn: () => buscarNoPortal(termoDebounced),
    enabled: open && termoDebounced.trim().length >= 2,
    staleTime: 30_000,
  });

  const { data: materiais = [] } = useQuery({
    queryKey: materialApoioQueryKey,
    queryFn: fetchMateriais,
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const pages = useMemo(() => {
    const all = [
      { title: "Início", url: "/", icon: LayoutDashboard, module: "Geral" },
      { title: "Material de Apoio", url: "/material-apoio", icon: BookOpen, module: "Ajuda" },
      { title: "Resultados Principais", url: "/principal", icon: BarChart3, module: "Indicadores", adminOnly: true },
      { title: "Base de Resultados Principais", url: "/principal/base", icon: FileSpreadsheet, module: "Indicadores", adminOnly: true },
      { title: "Provisão Diária", url: "/provisao", icon: Wallet, module: "Financeiro", adminOnly: true },
      { title: "[anexo]", url: "/anexos", icon: FileSpreadsheet, module: "Documentos" },
      { title: "Conciliação Bancária", url: "/conciliacao", icon: ShieldCheck, module: "Financeiro", adminOnly: true },
      { title: "Pagamentos Diversos", url: "/pagamentos", icon: Banknote, module: "Financeiro" },
      { title: "Administração de Comunicados", url: "/administracao", icon: Settings, module: "Gestão", adminOnly: true },
      { title: "Fechamento de Competência", url: "/fechamento", icon: FileSpreadsheet, module: "Financeiro" },
      { title: "Central de Divergências", url: "/divergencias", icon: AlertTriangle, module: "Financeiro" },
      { title: "Despesas Fixas", url: "/despesas-fixas", icon: Wallet, module: "Financeiro" },
      { title: "Exportação de Relatórios", url: "/exportacao", icon: Download, module: "Geral" },
      
      { title: "Auditoria", url: "/auditoria", icon: ScrollText, module: "Governança", allowedRoles: ["administrador", "auditor"] },
      { title: "Usuários", url: "/usuarios", icon: Users, module: "Gestão", adminOnly: true },
      { title: "Histórico de Versões", url: "/historico", icon: History, module: "Sistema" },
    ];
    return all.filter((item) => {
      if (item.adminOnly && !isAdmin) return false;
      if (item.allowedRoles && !hasAny(item.allowedRoles as never)) return false;
      return true;
    });
  }, [isAdmin, hasAny]);

  const goTo = (url: string, titulo: string) => {
    saveToHistory(titulo);
    setOpen(false);
    navigate({ to: url as never });
  };

  

  const hitsPorGrupo = useMemo(() => {
    const map = new Map<PortalHit["grupo"], PortalHit[]>();
    for (const h of hits) {
      const list = map.get(h.grupo) ?? [];
      list.push(h);
      map.set(h.grupo, list);
    }
    return Array.from(map.entries());
  }, [hits]);

  const trigger =
    variant === "hero" ? (
      <button
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 rounded-2xl border border-violet-200/80 bg-card px-4 py-4 text-left shadow-lg shadow-violet-100/50 transition-all duration-300 hover:border-violet-400 hover:shadow-xl hover:shadow-violet-200/50 dark:bg-card dark:shadow-none"
      >
        <Search className="h-5 w-5 shrink-0 text-violet-600" />
        <span className="flex-1 truncate text-sm text-muted-foreground">
          Matrícula, usuário, empresa, colaborador, fornecedor, competência, cards…
        </span>
      </button>
    ) : (
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-64 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
        aria-label="Busca total do portal"
      >
        <Search className="h-4 w-4 text-violet-600 xl:mr-2" />
        <span className="hidden text-xs font-medium text-muted-foreground xl:inline-flex">
          Busca…
        </span>
      </Button>
    );

  return (
    <>
      {trigger}

      <CommandDialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
        }}
      >
        <div className="flex items-center gap-2 border-none px-3">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            placeholder="Busque matrícula, usuário, empresa, colaborador, fornecedor, competência…"
            value={search}
            onValueChange={(v) => {
              setSearch(v);
            }}
            className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>

        {isAiMode && (
          <div className="max-h-[460px] overflow-y-auto">
            <div className="px-2 py-3">
                <div className="flex flex-col gap-4 rounded-lg border-none bg-violet-50/80 p-4 dark:bg-violet-900/20">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-medium text-foreground italic">"{search}"</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-none pt-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 shadow-sm dark:bg-violet-900/40">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      {isAiLoading ? (
                        <div className="flex items-center gap-2 text-xs italic text-violet-600 dark:text-violet-300">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Processando sua solicitação...
                        </div>
                      ) : (
                        <div className="whitespace-pre-line text-xs leading-relaxed text-violet-900 dark:text-violet-100">
                          {aiResponse}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isAiLoading && (
                    <div className="mt-2 flex flex-wrap gap-2 border-none pt-3">
                      <Button
                        size="sm"
                        className="h-7 gap-1.5 bg-violet-600 text-[10px] hover:bg-violet-700"
                        onClick={() => goTo("/material-apoio", "Material de Apoio")}
                      >
                        <BookOpen className="h-3 w-3" /> Ver Documentação
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] border-violet-200 hover:bg-violet-100 dark:border-violet-800 dark:hover:bg-violet-900/40"
                        onClick={() => setIsAiMode(false)}
                      >
                        Nova Pesquisa
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[10px] text-violet-600 hover:text-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/40"
                        onClick={() => {
                          setSearch("");
                          setIsAiMode(false);
                          setAiResponse(null);
                        }}
                      >
                        Limpar conversa
                      </Button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}


        {true && (
          <CommandList className="max-h-[460px]">
            <div className="py-6 text-center text-sm">
              <div className="flex flex-col items-center justify-center gap-1 py-6 text-center">
                <p className="text-sm font-medium">Nenhum resultado direto no portal.</p>
              </div>
            </div>
            <>
              {history.length > 0 && !search && (
                <CommandGroup
                  heading={
                    <div className="flex w-full items-center justify-between">
                      <span>Pesquisas recentes</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-[10px] text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearHistory();
                        }}
                      >
                        Limpar histórico
                      </Button>
                    </div>
                  }
                >
                  {history.map((term) => (
                    <CommandItem key={term} onSelect={() => setSearch(term)}>
                      <History className="mr-2 h-4 w-4" />
                      <span>{term}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {hitsPorGrupo.map(([grupo, lista]) => {
                const Icon = grupoIcon[grupo] ?? FileText;
                return (
                  <CommandGroup key={grupo} heading={grupo}>
                    {lista.map((h) => (
                      <CommandItem
                        key={h.id}
                        value={`${h.titulo} ${h.detalhe} ${grupo}`}
                        onSelect={() => goTo(h.url, h.titulo)}
                      >
                        <Icon className="mr-2 h-4 w-4 text-violet-600" />
                        <div className="flex flex-col">
                          <span>{h.titulo}</span>
                          {h.detalhe && (
                            <span className="text-[10px] text-muted-foreground">{h.detalhe}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}

              <CommandSeparator />

              <CommandGroup heading="Módulos e cards do portal">
                {pages.map((page) => (
                  <CommandItem
                    key={page.url}
                    value={`${page.title} ${page.module}`}
                    onSelect={() => goTo(page.url, page.title)}
                  >
                    <page.icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{page.title}</span>
                      <span className="text-[10px] text-muted-foreground">{page.module}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          </CommandList>
        )}


        <div className="flex items-center justify-end border-none bg-transparent px-4 py-1.5" />
      </CommandDialog>
    </>
  );
}

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
