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
  BarChart3
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

const RECENT_SEARCHES_KEY = "global_search_history";

type SearchResult = {
  id: string;
  title: string;
  module: string;
  url: string;
  icon: any;
  category: "Páginas" | "Ações" | "Recentes";
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const navigate = useNavigate();
  const { isAdmin, hasAny } = useRoles();

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

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex text-sm text-muted-foreground">Busca global...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="O que você está procurando?" 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          
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
                  onSelect={() => {
                    setSearch(term);
                  }}
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
        </CommandList>
      </CommandDialog>
    </>
  );
}
