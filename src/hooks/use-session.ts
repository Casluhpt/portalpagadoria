import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only update React state when the *identity* changes (sign in / sign out /
    // user swap). Ignore TOKEN_REFRESHED / INITIAL_SESSION churn — those fire
    // every ~15–60 min (and on tab focus) and would otherwise re-render the
    // whole app tree, tear down realtime channels, and re-run every query.
    const apply = (s: Session | null) => {
      const nextId = s?.user?.id ?? null;
      if (nextId !== lastUserIdRef.current) {
        lastUserIdRef.current = nextId;
        setSession(s);
      } else if (!session && s) {
        // First hydration where ids matched null->null shouldn't happen, but
        // guarantee we render at least once with the real session object.
        setSession(s);
      }
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        apply(s);
      } else {
        // TOKEN_REFRESHED / INITIAL_SESSION / PASSWORD_RECOVERY — just clear loading
        setLoading(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const role = session?.user?.user_metadata?.role || 'user';
  return { session, loading, user: session?.user ?? null, role };
}

