import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, ListChecks, Plus } from "lucide-react";
import { useIdentidade } from "@/hooks/use-identidade";
import { Button } from "@/components/ui/button";
import profarmaLogo from "@/assets/profarma-logo.png.asset.json";

export function PortalHeader() {
  const { identidade, hydrated, clear } = useIdentidade();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={profarmaLogo.url} alt="Profarma" className="h-8" />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-tight">Portal Pagadoria/ADP</p>
            <p className="text-xs text-slate-500 leading-tight">Atendimento a colaboradores</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="text-slate-700">
            <Link to="/minhas-solicitacoes">
              <ListChecks className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Minhas solicitações</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700">
            <Link to="/nova-solicitacao">
              <Plus className="mr-1.5 h-4 w-4" />
              Nova
            </Link>
          </Button>

          {hydrated && identidade && (
            <div className="ml-2 hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 pl-3 pr-1 py-1 md:flex">
              <div className="text-right leading-tight">
                <p className="text-xs font-medium text-slate-800">{identidade.nome}</p>
                <p className="text-[10px] text-slate-500">{identidade.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-500 hover:text-red-600"
                title="Trocar identificação"
                onClick={() => {
                  clear();
                  navigate({ to: "/identificar" });
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
