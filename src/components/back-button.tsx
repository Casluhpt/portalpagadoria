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
      className="group fixed left-6 top-6 z-[60] inline-flex h-9 items-center gap-2 rounded-lg bg-card/90 px-3 text-xs font-semibold text-foreground shadow-sm ring-1 ring-border backdrop-blur-md transition-all hover:bg-card hover:text-indigo-600 hover:shadow-md active:scale-95"
    >
      <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />
      <span>Voltar</span>
    </button>
  );
}
