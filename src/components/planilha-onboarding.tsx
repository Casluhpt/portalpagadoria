import { useState } from "react";
import { Sparkles, Table as TableIcon, Wand2, Repeat, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePlanilhaModo } from "@/hooks/use-planilha-modo";

/**
 * Apresentação da Planilha Inteligente no primeiro acesso.
 * O usuário escolhe entre Modo Inteligente e Modo Tradicional; a preferência
 * é salva no perfil e pode ser alterada depois em Configurações.
 */
export function PlanilhaOnboarding() {
  const { precisaApresentar, definirModo, salvando } = usePlanilhaModo();
  const [dispensado, setDispensado] = useState(false);

  const open = precisaApresentar && !dispensado;

  const escolher = async (modo: "inteligente" | "tradicional") => {
    try {
      await definirModo(modo, true);
      setDispensado(true);
      toast.success(
        modo === "inteligente"
          ? "Planilha Inteligente ativada — você pode desativar quando quiser em Configurações."
          : "Modo Tradicional mantido — nada muda no seu fluxo atual.",
      );
    } catch (e) {
      toast.error("Não foi possível salvar sua preferência: " + (e as Error).message);
    }
  };

  const itens = [
    { icon: Wand2, texto: "Sugere preenchimentos com base no histórico da base" },
    { icon: Repeat, texto: "Aprende padrões de utilização e facilita tarefas repetitivas" },
    { icon: ShieldCheck, texto: "Aponta campos incompletos e possíveis inconsistências" },
    { icon: TableIcon, texto: "O Modo Tradicional continua disponível, sem perda de funcionalidade" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setDispensado(true); }}>
      <DialogContent className="max-w-lg border-border bg-card/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <Sparkles className="h-4 w-4 text-violet-600" />
            </span>
            Conheça a Planilha Inteligente
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            Um recurso <b>opcional</b> que auxilia você durante os lançamentos. Ele atua apenas
            como assistência — você mantém total controle e pode ignorar qualquer sugestão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          {itens.map(({ icon: Icon, texto }) => (
            <div key={texto} className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
              <span className="text-xs leading-relaxed text-foreground">{texto}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="flex-1 gap-2 bg-violet-600 text-white hover:bg-violet-700"
            disabled={salvando}
            onClick={() => escolher("inteligente")}
          >
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Ativar Planilha Inteligente
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            disabled={salvando}
            onClick={() => escolher("tradicional")}
          >
            <TableIcon className="h-4 w-4" />
            Continuar no Modo Tradicional
          </Button>
        </div>

        <p className="text-[10px] italic leading-relaxed text-muted-foreground">
          Sua escolha fica salva no seu perfil e pode ser alterada a qualquer momento em
          Configurações › Planilha Inteligente.
        </p>
      </DialogContent>
    </Dialog>
  );
}
