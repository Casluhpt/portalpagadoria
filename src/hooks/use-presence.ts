import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useServerFn } from "@tanstack/react-start";
import { registrarSessaoUnica, verificarSessaoAtiva, heartbeatSessao } from "@/lib/session.functions";
import { toast } from "sonner";

// Gerador simples de ID de sessão para esta aba/instância
const getSessionId = () => {
  const existing = window.sessionStorage.getItem('portal_session_id');
  if (existing) return existing;
  const newId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  window.sessionStorage.setItem('portal_session_id', newId);
  return newId;
};

export function usePresence() {
  const { user } = useSession();
  const sessionId = useRef<string | null>(null);
  const registrarFn = useServerFn(registrarSessaoUnica);
  const verificarFn = useServerFn(verificarSessaoAtiva);
  const heartbeatFn = useServerFn(heartbeatSessao);
  const [sessionValida, setSessionValida] = useState(true);

  useEffect(() => {
    if (!user) return;

    sessionId.current = getSessionId();

    const initSession = async () => {
      try {
        await registrarFn({ data: { sessionId: sessionId.current! } });
      } catch (e) {
        console.error("Erro ao registrar sessão:", e);
      }
    };

    initSession();

    // Heartbeat e verificação a cada 30 segundos
    const interval = setInterval(async () => {
      if (!sessionId.current) return;
      try {
        const { valida } = await verificarFn({ data: { sessionId: sessionId.current } });
        if (!valida) {
          setSessionValida(false);
          toast.error("Sua sessão foi encerrada porque você entrou em outro dispositivo ou aba.", {
            duration: Infinity,
            description: "Você será deslogado em instantes para garantir a segurança."
          });
          
          setTimeout(() => {
            void supabase.auth.signOut().then(() => {
              window.location.href = "/auth";
            });
          }, 5000);
          return;
        }
        
        await heartbeatFn({ data: { sessionId: sessionId.current } });
      } catch (e) {
        console.error("Erro no heartbeat de sessão:", e);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id, registrarFn, verificarFn, heartbeatFn]);

  return { sessionValida, sessionId: sessionId.current };
}

