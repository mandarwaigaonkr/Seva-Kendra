/**
 * Short-lived cache for GET responses (pure; Node-testable: scripts/test-server-status.mjs).
 *
 * Moving between pages re-requests the same lists, dropdowns and stats; serving them from
 * memory for a few seconds makes navigation instant and spares a slow or waking server.
 * Any successful write clears everything (a saved record can change lists, follow-ups and
 * dashboard counts), as do sign-in and sign-out (another user may see different data).
 */
export const createRequestCache = ({ ttlMs = 30000, maxEntries = 200, now = () => Date.now() } = {}) => {
  const entries = new Map(); // key -> { value, at }
  const inFlight = new Map(); // key -> Promise
  let generation = 0; // bumped by clear(), so a load that started earlier is not stored

  const fresh = (entry) => entry && now() - entry.at < ttlMs;

  return {
    /** Cached value, or runs `load` once even if many callers ask at the same time. */
    async fetch(key, load) {
      const hit = entries.get(key);
      if (fresh(hit)) return hit.value;
      if (inFlight.has(key)) return inFlight.get(key);
      const startedIn = generation;
      const promise = (async () => {
        try {
          const value = await load();
          if (startedIn === generation) {
            entries.set(key, { value, at: now() });
            if (entries.size > maxEntries) entries.delete(entries.keys().next().value);
          }
          return value;
        } finally {
          if (inFlight.get(key) === promise) inFlight.delete(key);
        }
      })();
      inFlight.set(key, promise);
      return promise;
    },
    clear() {
      entries.clear();
      inFlight.clear();
      generation += 1;
    },
    size: () => entries.size,
  };
};

/** Stable key for a GET: url plus params in sorted order. */
export const cacheKey = (url, params) => {
  if (!params || typeof params !== "object") return String(url);
  const sorted = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .sort()
    .map((k) => `${k}=${typeof params[k] === "object" ? JSON.stringify(params[k]) : params[k]}`);
  return sorted.length ? `${url}?${sorted.join("&")}` : String(url);
};
