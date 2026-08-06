import { useSession } from "@/hooks/use-session";
import { Command, Home, Banknote, ShieldCheck, BookOpen, FileArchive, FileCheck2, Search, LineChart, Wallet, Settings, Users, History, AlertTriangle } from "lucide-react";

export function PortalFooter() {
  const { user } = useSession();

  if (!user) return null;

  const shortcutItems = [
    { key: "H", label: "Início", icon: Home },
    { key: "P", label: "Pagamentos", icon: Banknote },
    { key: "C", label: "Conciliação", icon: ShieldCheck },
    { key: "M", label: "Apoio", icon: BookOpen },
    { key: "A", label: "[anexo]", icon: FileArchive },
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
    <footer className="w-full border-t border-border/40 bg-card/40 backdrop-blur-md py-4 mt-auto overflow-hidden">
      <div className="mx-auto max-w-[1600px] px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 mr-2">
              <Command className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Atalhos Globais (Ctrl + Shift + Tecla)</span>
            </div>
            
            {shortcutItems.map((item) => (
              <div 
                key={item.key}
                className="group flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-2.5 py-1.5 shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5"
                title={`Ctrl + Shift + ${item.key}`}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <item.icon className="h-3 w-3" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[9px] font-bold text-foreground/70">{item.key}</span>
                  <span className="text-[8px] uppercase tracking-tighter text-muted-foreground font-medium">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground/60">
            Portal Pagadoria © 2026 · Versão v2.8.4
          </p>
        </div>
      </div>
    </footer>
  );
}
