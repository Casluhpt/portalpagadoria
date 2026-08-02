import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

type ShortcutHandler = (e: KeyboardEvent) => void;

/**
 * Hook para gerenciar atalhos globais de teclado (Ctrl/Cmd + Tecla).
 * @param shortcuts Mapa de teclas para funções
 */
export function useGlobalShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      
      const key = e.key.toLowerCase();
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

/**
 * Componente invisível para registrar atalhos padrões do portal.
 */
export function GlobalShortcutManager() {
  const navigate = useNavigate();
  
  useGlobalShortcuts({
    // Atalhos sugeridos baseados na navegação comum
    h: () => navigate({ to: "/" }),
    p: () => navigate({ to: "/pagamentos" }),
    c: () => navigate({ to: "/conciliacao" }),
    m: () => navigate({ to: "/material-apoio" }),
    a: () => navigate({ to: "/anexos" }),
    f: () => navigate({ to: "/fechamento" }),
  });

  return null;
}
