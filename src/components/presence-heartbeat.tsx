import { usePresence } from "@/hooks/use-presence";

/** Mounts the presence heartbeat once for the whole app. */
export function PresenceHeartbeat() {
  usePresence();
  return null;
}
