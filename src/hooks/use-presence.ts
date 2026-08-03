import { useEffect, useRef, useState } from "react";
import { useSession } from "@/hooks/use-session";
import { useServerFn } from "@tanstack/react-start";
import { heartbeatSessao } from "@/lib/session.functions";


export type PresenceStatus = "online" | "ausente" | "offline";

// Gerador simples de ID de sessão para esta aba/instância
const getSessionId = () => {
  if (typeof window === 'undefined') return '';
  const existing = window.sessionStorage.getItem('portal_session_id');
  if (existing) return existing;
  const newId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  window.sessionStorage.setItem('portal_session_id', newId);
  return newId;
};

export function usePresence() {
  const { user } = useSession();
  const sessionId = useRef<string | null>(null);
  const heartbeatFn = useServerFn(heartbeatSessao);
  const [sessionValida] = useState(true);

  
  // Status de presença (mantido para compatibilidade de UI)
  const [status, setStatusState] = useState<PresenceStatus>("online");
  const setStatus = (next: PresenceStatus) => setStatusState(next);

  useEffect(() => {
    if (!user) return;

    sessionId.current = getSessionId();

    // Múltiplas sessões/abas são permitidas: apenas mantemos o heartbeat,
    // sem invalidar sessões anteriores nem forçar logout.
    const interval = setInterval(async () => {
      if (!sessionId.current) return;
      try {
        await heartbeatFn({ data: { sessionId: sessionId.current } });
      } catch (e) {
        console.error("Erro no heartbeat de sessão:", e);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id, heartbeatFn]);

  return { sessionValida, sessionId: sessionId.current, status, setStatus };
}

