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
      className="group fixed left-4 top-1/2 z-40 -translate-y-1/2 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/40 ring-1 ring-white/20 backdrop-blur transition hover:from-violet-500 hover:to-indigo-600 hover:shadow-xl hover:shadow-violet-500/50 active:scale-95"
    >
      <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
      <span className="hidden sm:inline">Voltar</span>
    </button>
  );
}
