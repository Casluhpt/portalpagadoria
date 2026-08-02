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
  Sparkles,
  Bot,
  Loader2,
  Building2,
  Truck,
  CalendarRange,
  BookOpen,
  UserRound,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

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
import { perguntarIa } from "@/lib/ia.functions";

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
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const navigate = useNavigate();
  const { isAdmin, hasAny } = useRoles();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
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
      { title: "Provisão Diária", url: "/provisao", icon: Wallet, module: "Financeiro", adminOnly: true },
      { title: "Base de Anexos", url: "/anexos", icon: FileSpreadsheet, module: "Documentos" },
      { title: "Conciliação Bancária", url: "/conciliacao", icon: ShieldCheck, module: "Financeiro", adminOnly: true },
      { title: "Pagamentos Diversos", url: "/pagamentos", icon: Banknote, module: "Financeiro" },
      { title: "Administração de Comunicados", url: "/administracao", icon: Settings, module: "Gestão", adminOnly: true },
      { title: "Fechamento de Competência", url: "/fechamento", icon: FileSpreadsheet, module: "Financeiro" },
      { title: "Central de Divergências", url: "/divergencias", icon: AlertTriangle, module: "Financeiro" },
      { title: "Despesas Fixas", url: "/despesas-fixas", icon: Wallet, module: "Financeiro" },
      { title: "Exportação de Relatórios", url: "/exportacao", icon: Download, module: "Geral" },
      { title: "Dashboard Gerencial", url: "/dashboard-gerencial", icon: BarChart3, module: "Indicadores" },
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

  const askAi = async () => {
    const q = search.trim();
    if (q.length < 2) return;
    setIsAiLoading(true);
    setIsAiMode(true);
    setAiResponse(null);
    saveToHistory(q);
    const contexto = [
      "MÓDULOS DO PORTAL: " + pages.map((p) => `${p.title} (${p.url})`).join("; "),
      ...materiais
        .filter((m) => m.publicado)
        .map((m) => `### ${m.titulo} (${m.categoria})\n${m.conteudo}`),
    ]
      .join("\n\n")
      .slice(0, 55_000);
    try {
      const r = await perguntarIa({ data: { pergunta: q, contexto } });
      setAiResponse(
        r.resposta ?? r.erro ?? "Não foi possível consultar a IA Assistente agora.",
      );
    } catch {
      setAiResponse("Falha de comunicação com a IA Assistente. Tente novamente.");
    } finally {
      setIsAiLoading(false);
    }
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
        className="group flex w-full items-center gap-3 rounded-2xl border border-violet-200/80 bg-card px-4 py-3.5 text-left shadow-sm transition-all hover:border-violet-400 hover:shadow-md"
      >
        <Search className="h-5 w-5 shrink-0 text-violet-600" />
        <span className="flex-1 truncate text-sm text-muted-foreground">
          Central de busca total: matrícula, usuário, empresa, colaborador, fornecedor, competência,
          cards…
        </span>
        <span className="hidden items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold text-violet-700 sm:flex dark:bg-violet-900/40 dark:text-violet-300">
          <Sparkles className="h-3 w-3" /> IA Assistente
        </span>
        <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline">
          ⌘K
        </kbd>
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
          Busca total + IA…
        </span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] xl:flex">
          ⌘K
        </kbd>
      </Button>
    );

  return (
    <>
      {trigger}

      <CommandDialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setIsAiMode(false);
            setAiResponse(null);
          }
        }}
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            placeholder="Busque matrícula, usuário, empresa, colaborador, fornecedor, competência…"
            value={search}
            onValueChange={(v) => {
              setSearch(v);
              if (isAiMode) {
                setIsAiMode(false);
                setAiResponse(null);
              }
            }}
            className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          {search.trim().length >= 2 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 shrink-0 gap-1 bg-violet-100 px-2 text-[10px] text-violet-700 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300"
              onClick={askAi}
              disabled={isAiLoading}
            >
              {isAiLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              Perguntar IA
            </Button>
          )}
        </div>

        <CommandList className="max-h-[460px]">
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Bot className="mb-2 h-10 w-10 text-violet-300" />
              <p className="text-sm font-medium">Nenhum resultado direto no portal.</p>
              <Button variant="link" className="text-xs text-violet-600" onClick={askAi}>
                Perguntar à IA Assistente da Pagadoria
              </Button>
            </div>
          </CommandEmpty>

          {isAiMode && (
            <CommandGroup heading="IA Assistente da Pagadoria">
              <div className="px-2 py-3">
                <div className="rounded-lg border border-violet-100 bg-violet-50/80 p-4 dark:border-violet-800 dark:bg-violet-900/20">
                  {isAiLoading ? (
                    <div className="flex items-center gap-2 text-xs italic text-violet-600 dark:text-violet-300">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Consultando o material de apoio autorizado…
                    </div>
                  ) : (
                    <div className="whitespace-pre-line text-xs leading-relaxed text-violet-900 dark:text-violet-100">
                      {aiResponse}
                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-[10px]"
                          onClick={() => goTo("/material-apoio", "Material de Apoio")}
                        >
                          Abrir Material de Apoio
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px]"
                          onClick={() => setIsAiMode(false)}
                        >
                          Nova pesquisa
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CommandGroup>
          )}

          {!isAiMode && (
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
          )}
        </CommandList>

        <div className="flex items-center justify-between border-t bg-muted/50 px-4 py-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-background px-1">↑↓</kbd> Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-background px-1">↵</kbd> Abrir
            </span>
          </div>
          <div className="flex items-center gap-1 font-medium text-violet-600">
            <Sparkles className="h-3 w-3" /> Busca total + IA da Pagadoria
          </div>
        </div>
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
