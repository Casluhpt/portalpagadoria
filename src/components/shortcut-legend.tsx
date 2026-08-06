import { useState, useEffect } from "react";
import { Command, Home, Banknote, ShieldCheck, BookOpen, FileArchive, FileCheck2, Search, LineChart, Wallet, Settings, Users, History, AlertTriangle, X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { useShortcutLegend } from "@/hooks/use-shortcut-legend";
import { cn } from "@/lib/utils";

export function ShortcutLegend() {
  const { user } = useSession();
  const { isEnabled } = useShortcutLegend();
  const [isVisible, setIsVisible] = useState(false);

  if (!user || !isEnabled) return null;

  const shortcutItems = [
    { key: "H", label: "Início", icon: Home },
    { key: "P", label: "Pagamentos", icon: Banknote },
    { key: "C", label: "Conciliação", icon: ShieldCheck },
    { key: "M", label: "Apoio", icon: BookOpen },
    { key: "A", label: "Anexos", icon: FileArchive },
    { key: "F", label: "Fechamento", icon: FileCheck2 },
    { key: "K", label: "Busca/IA", icon: Search },
    { key: "D", label: "Despesas", icon: Wallet },
    { key: "R", label: "Resultados", icon: LineChart },
    { key: "S", label: "Config", icon: Settings },
    { key: "U", label: "Usuários", icon: Users },
    { key: "B", label: "Auditoria", icon: History },
    { key: "G", label: "Divergência", icon: AlertTriangle },
  ];

  return (
    <>
      {/* Botão Flutuante para Abrir a Legenda */}
      <button
        onClick={() => setIsVisible(true)}
        className={cn(
          "fixed bottom-6 left-6 z-[90] flex h-12 w-12 items-center justify-center rounded-full bg-background/40 backdrop-blur-md border border-white/10 shadow-xl transition-all hover:scale-110 active:scale-95 group",
          isVisible && "opacity-0 pointer-events-none"
        )}
        title="Ver Atalhos Globais"
      >
        <Keyboard className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
        </span>
      </button>

      {/* Quadro de Atalhos */}
      {isVisible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/20 bg-card/60 p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsVisible(false)}
              className="absolute right-6 top-6 rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary ring-1 ring-primary/30">
                <Command className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Atalhos Globais</h3>
                <p className="text-sm text-muted-foreground">Pressione <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-bold text-foreground">Ctrl</kbd> + <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-bold text-foreground">Shift</kbd> + <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-bold text-foreground">Tecla</kbd></p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {shortcutItems.map((item) => (
                <div 
                  key={item.key}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3 transition-all hover:bg-white/10 hover:border-primary/20 group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground/90">
                      <span className="text-primary mr-1">{item.key}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">({item.label})</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Button 
                variant="outline" 
                onClick={() => setIsVisible(false)}
                className="rounded-full px-8 border-white/10 hover:bg-white/5"
              >
                Entendi
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
