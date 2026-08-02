import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeMode = "claro" | "noturno" | "sistema" | "automatico";

export type ThemeConfig = {
  mode: ThemeMode;
  /** hora (0-23) em que o modo noturno começa */
  inicioNoturno: number;
  /** hora (0-23) em que o modo claro volta */
  inicioClaro: number;
};

const STORAGE_KEY = "portal_theme_config";
const DEFAULT_CONFIG: ThemeConfig = { mode: "sistema", inicioNoturno: 19, inicioClaro: 7 };

type Ctx = {
  config: ThemeConfig;
  resolved: "claro" | "noturno";
  setMode: (m: ThemeMode) => void;
  setHorarios: (inicioNoturno: number, inicioClaro: number) => void;
};

const ThemeContext = createContext<Ctx | null>(null);

function prefersDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function dentroDoNoturno(cfg: ThemeConfig, now = new Date()) {
  const h = now.getHours();
  const { inicioNoturno: n, inicioClaro: c } = cfg;
  if (n === c) return false;
  return n > c ? h >= n || h < c : h >= n && h < c;
}

function resolve(cfg: ThemeConfig): "claro" | "noturno" {
  if (cfg.mode === "claro") return "claro";
  if (cfg.mode === "noturno") return "noturno";
  if (cfg.mode === "automatico") return dentroDoNoturno(cfg) ? "noturno" : "claro";
  return prefersDark() ? "noturno" : "claro";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_CONFIG);
  const [resolved, setResolved] = useState<"claro" | "noturno">("claro");

  // Carrega a preferência salva do usuário após a hidratação.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setConfig({ ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<ThemeConfig>) });
    } catch {
      /* ignora */
    }
  }, []);

  useEffect(() => {
    const apply = () => setResolved(resolve(config));
    apply();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (config.mode === "sistema") mq.addEventListener("change", apply);

    let timer: ReturnType<typeof setInterval> | undefined;
    if (config.mode === "automatico") timer = setInterval(apply, 30_000);

    return () => {
      mq.removeEventListener("change", apply);
      if (timer) clearInterval(timer);
    };
  }, [config]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "noturno");
  }, [resolved]);

  const value = useMemo<Ctx>(
    () => ({
      config,
      resolved,
      setMode: (mode) => {
        const next = { ...config, mode };
        setConfig(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      },
      setHorarios: (inicioNoturno, inicioClaro) => {
        const next = { ...config, inicioNoturno, inicioClaro };
        setConfig(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      },
    }),
    [config, resolved],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  }
  return ctx;
}
