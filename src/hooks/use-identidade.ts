import { useEffect, useState, useCallback } from "react";

export type Identidade = { nome: string; email: string };
const KEY = "portal.identidade";

// Regex: "Nome Sobrenome" — pelo menos 2 palavras, cada uma iniciando com maiúscula.
export const NAME_REGEX = /^[A-ZÀ-Ý][a-zà-ÿ']+(?:\s+[A-ZÀ-Ý][a-zà-ÿ']+)+$/;
export const EMAIL_REGEX = /^[^\s@]+@profarma\.com\.br$/i;

export function validateNome(value: string): string | null {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed.includes(" ")) return "Informe o nome no padrão Nome Sobrenome.";
  if (!NAME_REGEX.test(trimmed))
    return "Informe o nome no padrão Nome Sobrenome (primeira letra de cada palavra maiúscula).";
  return null;
}

export function validateEmail(value: string): string | null {
  if (!EMAIL_REGEX.test(value.trim().toLowerCase()))
    return "Use um e-mail corporativo @profarma.com.br.";
  return null;
}

function read(): Identidade | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Identidade) : null;
  } catch {
    return null;
  }
}

export function useIdentidade() {
  const [identidade, setState] = useState<Identidade | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(read());
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setState(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const save = useCallback((data: Identidade) => {
    const nome = data.nome.trim().replace(/\s+/g, " ");
    const email = data.email.trim().toLowerCase();
    const next = { nome, email };
    window.localStorage.setItem(KEY, JSON.stringify(next));
    setState(next);
  }, []);

  const clear = useCallback(() => {
    window.localStorage.removeItem(KEY);
    setState(null);
  }, []);

  return { identidade, hydrated, save, clear };
}
