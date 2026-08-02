import { useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Não mostra na home nem na tela de autenticação
  if (pathname === "/" || pathname.startsWith("/auth")) return null;

  const onClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      router.navigate({ to: "/" });
    }
  };

  return (
    <button
      onClick={onClick}
      aria-label="Voltar para a tela anterior"
      title="Voltar"
      className="group fixed bottom-5 left-4 z-[60] inline-flex h-10 items-center gap-2 rounded-full bg-background/60 px-4 text-xs font-semibold text-foreground shadow-[var(--shadow-elegant)] ring-1 ring-border/40 backdrop-blur-2xl transition-all duration-500 hover:bg-background/80 hover:text-primary hover:shadow-[var(--shadow-glow)] hover:translate-x-1 active:scale-95 lg:bottom-auto lg:left-6 lg:top-6 lg:rounded-xl lg:px-4"
    >
      <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-1" />
      <span>Voltar</span>
    </button>
  );
}
