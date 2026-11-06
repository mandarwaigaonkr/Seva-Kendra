/**
 * Tells people when the server is asleep and starting (free hosting sleeps after ~15 idle
 * minutes and takes up to a minute to wake), and when it can't be reached at all.
 * Waits a moment before appearing so a quick answer never flashes a banner; says when the
 * server is ready again. Requests made meanwhile wait and continue by themselves (lib/api.js).
 */
import React, { useEffect, useRef, useState } from "react";
import { CloudOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { serverStatus } from "@/lib/api";
import { useElapsedSeconds, useServerStatus } from "@/hooks/useServerStatus";

const SHOW_AFTER_MS = 1200;

const wakingDetail = (seconds) => {
  if (seconds < 20) return "This happens after a quiet spell and usually takes under a minute.";
  if (seconds < 60) return "Almost there. Anything you asked for will load by itself.";
  return "This is taking longer than usual. Please keep this page open.";
};

export default function ServerStatusBanner() {
  const { status, since } = useServerStatus();
  const [visible, setVisible] = useState(false);
  const wasShown = useRef(false);
  const seconds = useElapsedSeconds(since, status === "waking");

  useEffect(() => {
    if (status === "waking") {
      const id = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
      return () => clearTimeout(id);
    }
    if (status === "down") setVisible(true);
    if (status === "ready") {
      if (wasShown.current) toast.success("The server is ready.", { id: "server-ready" });
      setVisible(false);
    }
    return undefined;
  }, [status]);

  useEffect(() => {
    if (visible) wasShown.current = true;
    else if (status === "ready") wasShown.current = false;
  }, [visible, status]);

  if (!visible || (status !== "waking" && status !== "down")) return null;

  const down = status === "down";
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2"
    >
      <div className="flex w-full max-w-xl items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
        {down ? (
          <CloudOff className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
        ) : (
          <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-info motion-reduce:animate-none" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem] font-medium text-foreground">
            {down ? "We can't reach the server" : "Starting the server…"}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {down
              ? "Check your internet connection, then try again. Nothing you typed has been lost."
              : wakingDetail(seconds)}
          </p>
        </div>
        {down ? (
          <Button size="sm" variant="outline" onClick={() => serverStatus.retry()} className="shrink-0">
            Try again
          </Button>
        ) : (
          <span className="shrink-0 pt-0.5 text-sm tabular-nums text-muted-foreground" aria-hidden>
            {seconds}s
          </span>
        )}
      </div>
    </div>
  );
}
