import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  /** Nome do módulo, usado na mensagem e no log técnico. */
  modulo: string;
  onReset?: () => void;
};

type State = { error: Error | null };

/**
 * Error Boundary de módulo: mantém a página aberta, apresenta mensagem objetiva
 * ao usuário e registra o erro técnico no console para diagnóstico.
 */
export class ModuleErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.modulo}] falha de renderização`, error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="m-4 rounded-2xl border border-amber-200/60 bg-card/70 p-8 text-center backdrop-blur">
        <AlertTriangle className="mx-auto h-9 w-9 text-amber-500" />
        <h2 className="mt-3 text-base font-semibold text-foreground">
          Não foi possível montar {this.props.modulo}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          A página continua aberta. Recarregue os dados ou ajuste os filtros. O erro técnico foi
          registrado para diagnóstico.
        </p>
        <p className="mx-auto mt-2 max-w-md truncate text-[11px] text-muted-foreground/70">
          {this.state.error.message}
        </p>
        <Button size="sm" variant="outline" className="mt-4 gap-2" onClick={this.reset}>
          <RotateCcw className="h-4 w-4" /> Recarregar dados
        </Button>
      </div>
    );
  }
}
