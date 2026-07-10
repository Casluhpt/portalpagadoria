import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export type PresenceStatus = "online" | "ausente" | "offline";
const KEY = "presence_status_pref";
const HEARTBEAT_MS = 45_000;

async function push(status: PresenceStatus) {
  try {
    await supabase.rpc("set_presence" as never, { _status: status } as never);
  } catch {
    /* ignore transient errors */
  }
}

export function usePresence() {
  const { user } = useSession();
  const [status, setStatusState] = useState<PresenceStatus>("online");
  const statusRef = useRef<PresenceStatus>("online");

  // Load stored preference once
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(KEY) as PresenceStatus | null;
    if (stored === "online" || stored === "ausente" || stored === "offline") {
      setStatusState(stored);
      statusRef.current = stored;
    }
  }, []);

  const setStatus = useCallback((next: PresenceStatus) => {
    setStatusState(next);
    statusRef.current = next;
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, next);
    void push(next);
  }, []);

  // On login → announce, heartbeat while tab visible, offline on unload
  useEffect(() => {
    if (!user?.id) return;
    // Announce current status immediately
    void push(statusRef.current);

    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      if (statusRef.current === "offline") return;
      void push(statusRef.current);
    };
    const interval = window.setInterval(tick, HEARTBEAT_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible" && statusRef.current !== "offline") {
        void push(statusRef.current);
      }
    };
    const onUnload = () => { void push("offline"); };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
    };
  }, [user?.id]);

  // Sign out → offline
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") void push("offline");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { status, setStatus };
}
