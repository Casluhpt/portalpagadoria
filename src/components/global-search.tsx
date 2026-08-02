import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Search, 
  Command as CommandIcon, 
  X, 
  History, 
  Trash2, 
  FileText, 
  Users, 
  LayoutDashboard, 
  Wallet, 
  Banknote,
  ShieldCheck,
  Landmark,
  FileSpreadsheet,
  Settings,
  AlertTriangle,
  Download,
  ScrollText,
  BarChart3,
  Sparkles,
  Send,
  Bot,
  Loader2
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from "@/hooks/use-session";

const RECENT_SEARCHES_KEY = "global_search_history";

type SearchResult = {
  id: string;
  title: string;
  module: string;
  url: string;
  icon: any;
  category: "Páginas" | "Ações" | "Recentes" | "IA";
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const navigate = useNavigate();
  const { isAdmin, hasAny } = useRoles();
  const { user } = useSession();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
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
      } catch (e) {
        console.error("Failed to parse search history", e);
      }
    }
  }, []);

  const saveToHistory = useCallback((term: string) => {
    if (!term.trim()) return;
    const newHistory = [term, ...history.filter((h) => h !== term)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newHistory));
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  const pages = useMemo((): SearchResult[] => {
    const all = [
      { title: "Início", url: "/", icon: LayoutDashboard, module: "Geral" },
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

    return all
      .filter(item => {
        if (item.adminOnly && !isAdmin) return false;
        if (item.allowedRoles && !hasAny(item.allowedRoles as any)) return false;
        return true;
      })
      .map(item => ({
        id: item.url,
        title: item.title,
        module: item.module,
        url: item.url,
        icon: item.icon,
        category: "Páginas"
      }));
  }, [isAdmin, hasAny]);

  const handleSelect = (result: SearchResult) => {
    saveToHistory(result.title);
    setOpen(false);
    navigate({ to: result.url as any });
  };

  const askAi = async () => {
    if (!search.trim()) return;
    setIsAiLoading(true);
    setIsAiMode(true);
    
    // Simulating AI response based on the search context
    setTimeout(() => {
      setAiResponse(`Olá! Com base na sua busca por "${search}", encontrei informações relevantes na Central de Inteligência. 
      
Para acessar detalhes sobre pagamentos, recomendo o módulo de **Pagamentos Diversos**. Se estiver buscando indicadores consolidados, o **Dashboard Executivo** possui os KPIs que você precisa. 

Deseja que eu te leve para algum desses módulos?`);
      setIsAiLoading(false);
    }, 1500);
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-64 xl:justify-start xl:px-3 xl:py-2 bg-indigo-50/30 border-indigo-100 hover:bg-indigo-50/50 dark:bg-indigo-900/10 dark:border-indigo-900/30"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2 text-indigo-600 dark:text-indigo-400" />
        <span className="hidden xl:inline-flex text-xs font-medium text-indigo-900/70 dark:text-indigo-300/70">Busca inteligente (IA + Pesquisa)...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-indigo-100/50 px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex text-indigo-700">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={(val) => {
        setOpen(val);
        if (!val) {
          setIsAiMode(false);
          setAiResponse(null);
        }
      }}>
        <div className="flex items-center border-b px-3 overflow-hidden">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput 
            placeholder="Busque módulos ou pergunte à IA Assistente..." 
            value={search}
            onValueChange={(v) => {
              setSearch(v);
              if (isAiMode) {
                setIsAiMode(false);
                setAiResponse(null);
              }
            }}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          {search.length > 3 && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="ml-2 h-7 gap-1 px-2 text-[10px] bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
              onClick={askAi}
              disabled={isAiLoading}
            >
              {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Perguntar IA
            </Button>
          )}
        </div>
        
        <CommandList className="max-h-[450px]">
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Bot className="h-10 w-10 text-indigo-300 mb-2" />
              <p className="text-sm font-medium">Nenhum resultado direto.</p>
              <Button 
                variant="link" 
                className="text-xs text-indigo-600"
                onClick={askAi}
              >
                Tentar busca inteligente com IA?
              </Button>
            </div>
          </CommandEmpty>
          
          {isAiMode && (
            <CommandGroup heading="Resposta da IA Assistente">
              <div className="px-2 py-3">
                <div className="rounded-lg bg-indigo-50/80 p-4 border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800">
                  {isAiLoading ? (
                    <div className="flex items-center gap-2 text-xs text-indigo-600 italic">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Processando conhecimento da Pagadoria...
                    </div>
                  ) : (
                    <div className="text-xs leading-relaxed text-indigo-900 dark:text-indigo-200 whitespace-pre-line">
                      {aiResponse}
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" className="h-7 text-[10px] bg-indigo-600 hover:bg-indigo-700">Ver Módulo Sugerido</Button>
                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setIsAiMode(false)}>Nova Pesquisa</Button>
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
                <CommandGroup heading={
                  <div className="flex items-center justify-between w-full">
                    <span>Pesquisas Recentes</span>
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
                }>
                  {history.map((term) => (
                    <CommandItem
                      key={term}
                      onSelect={() => setSearch(term)}
                    >
                      <History className="mr-2 h-4 w-4" />
                      <span>{term}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandSeparator />

              <CommandGroup heading="Módulos e Páginas">
                {pages.map((page) => (
                  <CommandItem
                    key={page.id}
                    onSelect={() => handleSelect(page)}
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
              <kbd className="rounded border bg-background px-1">↵</kbd> Selecionar
            </span>
          </div>
          <div className="flex items-center gap-1 text-indigo-600 font-medium">
            <Sparkles className="h-3 w-3" />
            Busca Inteligente Ativa
          </div>
        </div>
      </CommandDialog>
    </>
  );
}
