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
    <footer className="w-full border-t border-border/40 bg-card/40 backdrop-blur-md py-4 mt-auto">
      <div className="mx-auto max-w-[1600px] px-4">
        <div className="flex items-center justify-center">
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground/60">
            Portal Pagadoria © 2026 · Versão v2.8.5
          </p>
        </div>
      </div>
    </footer>
  );
}
