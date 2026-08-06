import { useErrorLogStore } from "@/hooks/use-error-log-store";

type LovableErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type LovableEvents = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: LovableErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __lovableEvents?: LovableEvents;
  }
}

export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const route = window.location.pathname;

  // Track in local store for diagnostic panel
  try {
    const store = useErrorLogStore.getState();
    if (store && typeof store.addError === 'function') {
      store.addError({
        message,
        stack,
        route,
        severity: 'error'
      });
    }
  } catch (e) {
    // Fail silently to avoid infinite error loops
    console.warn("Silent failure in error logging store:", e);
  }

  // Ensure window.__lovableEvents exists before calling to prevent crash
  try {
    window.__lovableEvents?.captureException?.(
      error,
      {
        source: "react_error_boundary",
        route,
        ...context,
      },
      {
        mechanism: "react_error_boundary",
        handled: false,
        severity: "error",
      },
    );
  } catch (e) {
    console.error("Critical failure in window.__lovableEvents:", e);
  }
}
