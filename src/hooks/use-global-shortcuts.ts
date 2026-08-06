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
      // Alterado para Ctrl + Shift + Tecla a pedido do usuário
      if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;
      
      const key = e.key.toLowerCase();
      // 'k' já é tratado no global-search.tsx, mas se quisermos unificar, podemos adicionar aqui
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
    // Atalhos atualizados para Ctrl + Shift + Letra
    h: () => navigate({ to: "/" }),
    p: () => navigate({ to: "/pagamentos" }),
    c: () => navigate({ to: "/conciliacao" }),
    m: () => navigate({ to: "/material-apoio" }),
    a: () => navigate({ to: "/anexos" }),
    f: () => navigate({ to: "/fechamento" }),
    d: () => navigate({ to: "/despesas-fixas" }),
    e: () => navigate({ to: "/esocial" }),
    r: () => navigate({ to: "/principal" }),
    s: () => navigate({ to: "/configuracoes" }),
    u: () => navigate({ to: "/usuarios" }),
    b: () => navigate({ to: "/auditoria" }), // B de Base/Auditoria
    t: () => navigate({ to: "/principal/base" }), // T de Tabela de Resultados
    g: () => navigate({ to: "/divergencias" }), // G de Gap/Divergência
    l: () => navigate({ to: "/provisao/base" }), // L de Lançamentos de Provisão
  });

  return null;
}
