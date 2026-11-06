/**
 * Is the backend awake? (pure; Node-testable: scripts/test-server-status.mjs)
 *
 * The free Render backend sleeps after ~15 idle minutes and takes up to a minute to start.
 * While it starts, requests either fail outright or get Render's own HTML "loading" page,
 * so "no answer" and "an answer that isn't our JSON" both mean "still waking".
 *
 * States: "unknown" (not checked yet) → "waking" (checking, not answered yet) → "ready",
 * or "down" when it has not answered within `giveUpAfterMs`. Anyone can `subscribe`;
 * `whenReady()` resolves once the server answers (and starts a check if none is running).
 */

export const DEFAULT_WAKE = Object.freeze({
  giveUpAfterMs: 120000, // Render says "up to a minute"; allow double before calling it down
  firstRetryMs: 1500,
  maxRetryMs: 5000,
  requestTimeoutMs: 8000,
  readyForMs: 60000, // after a good answer, trust it this long before checking again
});

export const createServerStatus = ({ ping, now = () => Date.now(), sleep, options = {} }) => {
  const opts = { ...DEFAULT_WAKE, ...options };
  const wait = sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  let state = { status: "unknown", since: now(), lastReadyAt: 0, attempts: 0 };
  const listeners = new Set();
  let running = null;

  const set = (patch) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener(state));
  };

  const check = async () => {
    const started = now();
    set({ status: "waking", since: started, attempts: 0 });
    let delay = opts.firstRetryMs;
    for (;;) {
      set({ attempts: state.attempts + 1 });
      let ok = false;
      try {
        ok = await ping(opts.requestTimeoutMs);
      } catch {
        ok = false;
      }
      // A real request may have succeeded meanwhile (markReady): the server is up, stop.
      if (ok || state.status === "ready") {
        set({ status: "ready", lastReadyAt: now() });
        return true;
      }
      if (now() - started >= opts.giveUpAfterMs) {
        set({ status: "down" });
        return false;
      }
      await wait(delay);
      if (state.status === "ready") return true;
      delay = Math.min(opts.maxRetryMs, Math.round(delay * 1.5));
    }
  };

  /** Resolves true when the server answers, false if it stays unreachable. */
  const whenReady = () => {
    if (state.status === "ready" && now() - state.lastReadyAt < opts.readyForMs) return Promise.resolve(true);
    if (!running) {
      running = check().finally(() => {
        running = null;
      });
    }
    return running;
  };

  return {
    get: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    whenReady,
    /** A real request just succeeded: no need to ping. */
    markReady: () => {
      if (state.status !== "ready" || now() - state.lastReadyAt > 1000) set({ status: "ready", lastReadyAt: now() });
    },
    /** A real request failed in a way that looks like a sleeping server: start checking. */
    markUnreachable: () => {
      if (state.status === "ready") set({ status: "unknown", lastReadyAt: 0 });
      return whenReady();
    },
    /** Forget "down" and try again (Retry button). */
    retry: () => {
      if (!running) set({ status: "unknown", lastReadyAt: 0 });
      return whenReady();
    },
  };
};

/**
 * Does this failed axios request look like the server is asleep / starting, rather than a
 * real answer? No response at all, a gateway error, or a non-JSON body (Render's page).
 */
export const looksLikeSleepingServer = (error) => {
  if (!error) return false;
  const res = error.response;
  if (!res) return error.code !== "ERR_CANCELED"; // network error, CORS-less loading page, timeout
  if ([502, 503, 504].includes(res.status)) return true;
  const type = String(res.headers?.["content-type"] || "");
  return res.status >= 500 && type.includes("text/html");
};

/** Root of the backend (strips "/api/v1") for the health check. */
export const healthUrlFor = (apiBaseUrl) => `${String(apiBaseUrl).replace(/\/api\/v\d+\/?$/, "").replace(/\/$/, "")}/health`;

/**
 * Is this /health answer "awake and ready"? Any 2xx whose body says status "ok". A database
 * state, when reported, must be 1 (connected); a missing one is not held against it.
 */
export const isHealthyResponse = (status, body) => {
  if (!(status >= 200 && status < 300)) return false;
  const data = typeof body === "string" ? safeJson(body) : body;
  if (!data || data.status !== "ok") return false;
  return data.dbState === undefined || data.dbState === 1;
};

const safeJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};
