import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModuleStub } from "@/components/module-stub";

export const Route = createFileRoute("/historico")({
  component: HistoricoPage,
});

const VERSIONS = [
  {
    version: "1.6.0",
    date: "02/08/2026",
    changes: [
      "Renomeado 'Administração do Portal' para 'Administração de Comunicados'.",
      "Implementado exclusão em lote de comunicados.",
      "Adicionado suporte a envio de comunicados por e-mail e portal.",
      "Atualizado setores: 'Visitante' agora é 'Gerência/Visitante'.",
      "Adicionado setor 'Pagadoria' na administração de usuários.",
      "Melhorias visuais e diagnósticos em Configurações Avançadas.",
      "Estruturação inicial do Fechamento de Competência.",
    ]
  },
  {
    version: "1.5.0",
    date: "28/07/2026",
    changes: [
      "Implementação do módulo de Despesas Fixas.",
      "Adicionado Auditoria de registros excluídos.",
      "Melhorias no Dashboard do Processo de Aprovação.",
    ]
  }
];

function HistoricoPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold text-slate-700">Histórico de Versões</h1>
          </header>
          <main className="flex-1 p-6 space-y-6">
            <div className="max-w-3xl mx-auto space-y-8">
              {VERSIONS.map((v) => (
                <div key={v.version} className="relative pl-8 border-l-2 border-indigo-100 pb-8 last:pb-0">
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-indigo-600 border-4 border-white" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-slate-900">Versão {v.version}</h2>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{v.date}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {v.changes.map((change, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            <ModuleStub
              title="Addons do Portal"
              description="Histórico completo de atualizações e correções do sistema."
              phase="v1.6.0"
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}