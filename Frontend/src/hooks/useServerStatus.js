import { useEffect, useState, useSyncExternalStore } from "react";

import { serverStatus } from "@/lib/api";

/** Current server state: { status: "unknown" | "waking" | "ready" | "down", since, attempts }. */
export const useServerStatus = () => useSyncExternalStore(serverStatus.subscribe, serverStatus.get, serverStatus.get);

/** Seconds since `since`, ticking once a second while `active`. */
export const useElapsedSeconds = (since, active) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, since]);
  return Math.max(0, Math.round((now - since) / 1000));
};
