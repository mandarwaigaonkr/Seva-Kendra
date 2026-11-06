import axios from "axios";
import { toast } from "sonner";

import { createServerStatus, healthUrlFor, isHealthyResponse, looksLikeSleepingServer } from "./serverStatus";
import { cacheKey, createRequestCache } from "./requestCache";

// VITE_API_URL is set at build time (Render static site env). Without it, production
// assumes the API is on the same site under /api/v1.
const baseURL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api/v1" : "http://localhost:5000/api/v1");

// While > 0, the response interceptor does not toast errors. Callers that
// report errors themselves (bulk Excel import) wrap their requests in
// runWithoutErrorToasts so a 200-row import doesn't produce 200 toasts.
let silentErrorDepth = 0;

export const runWithoutErrorToasts = async (fn) => {
  silentErrorDepth += 1;
  try {
    return await fn();
  } finally {
    silentErrorDepth -= 1;
  }
};

/* ------------------------------------------------------------------ */
/* Is the server awake? (free hosting sleeps when idle)                */
/* ------------------------------------------------------------------ */

const healthUrl = healthUrlFor(baseURL);

// Same transport as every other request (axios/XHR, no interceptors), so anything that lets
// the app's normal requests through (browser settings, extensions) lets this through too.
const healthClient = axios.create({ timeout: 8000 });

const pingHealth = async (timeoutMs) => {
  try {
    const res = await healthClient.get(healthUrl, { timeout: timeoutMs, params: { t: Date.now() } });
    const healthy = isHealthyResponse(res.status, res.data);
    if (!healthy) console.warn("Health check: unexpected answer", res.status, res.data);
    return healthy;
  } catch (error) {
    console.warn("Health check failed:", error.code || error.message, error.response?.status ?? "");
    return false;
  }
};

export const serverStatus = createServerStatus({ ping: pingHealth });

/** Start waking the server now (app load, sign-in page) so it is ready by the time it's needed. */
export const warmUpServer = () => serverStatus.whenReady();

const SLEEPING_MESSAGE =
  "The server didn't respond. It may still be starting, or your internet may be down. Please try again in a minute.";

/* ------------------------------------------------------------------ */
/* Client                                                              */
/* ------------------------------------------------------------------ */

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Recently fetched GET responses, so moving between pages is instant.
export const responseCache = createRequestCache({ ttlMs: 30000 });

/** Drop cached responses (after sign-in / sign-out, or when fresh data is required). */
export const clearResponseCache = () => responseCache.clear();

const rawGet = api.get.bind(api);
api.get = (url, config = {}) => {
  const cacheable = config.cache !== false && !config.responseType && !String(url).startsWith("/auth");
  if (!cacheable) return rawGet(url, config);
  return responseCache.fetch(cacheKey(url, config.params), () => rawGet(url, config));
};

api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If we already know the server is starting, wait for it instead of firing requests
    // that will fail. Requests go ahead (and report the problem) if it never answers.
    const { status } = serverStatus.get();
    if (status === "waking") await serverStatus.whenReady();
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    serverStatus.markReady();
    const method = response.config?.method;
    if (method && method !== "get") responseCache.clear(); // a write may change any list
    return response.data;
  },
  async (error) => {
    const config = error.config || {};

    // Sleeping or starting server: wait for it, then send the request once more. Reads
    // are always safe to repeat; a write is repeated only when it can't have reached the
    // app (no answer at all, or a gateway error from the host's proxy).
    if (looksLikeSleepingServer(error) && !config._wokeAndRetried) {
      const ready = await serverStatus.markUnreachable();
      const neverReachedApp = !error.response || [502, 503, 504].includes(error.response.status);
      const method = String(config.method || "get").toLowerCase();
      if (ready && (method === "get" || neverReachedApp)) {
        config._wokeAndRetried = true;
        return api.request(config);
      }
      if (!ready) {
        // The status banner already explains this; one toast is enough.
        if (silentErrorDepth === 0) toast.error(SLEEPING_MESSAGE, { id: "server-unreachable" });
        return Promise.reject(Object.assign(new Error(SLEEPING_MESSAGE), { status: 0, serverUnreachable: true }));
      }
    }

    // Extract error message from response
    let errorMessage = "Something went wrong. Please try again.";

    if (error.response) {
      serverStatus.markReady(); // it answered, so it is awake
      const { data, status, config: responseConfig } = error.response;

      if (status === 401) {
        errorMessage = data?.message || "Session expired. Please sign in again.";
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        responseCache.clear();
        const sessionError = Object.assign(new Error(errorMessage), { status });
        // During a bulk import the caller stops, shows what was saved and offers sign-in;
        // redirecting here would throw that result away.
        if (silentErrorDepth === 0) {
          toast.error(errorMessage);
          window.location.href = "/signin";
        }
        return Promise.reject(sessionError);
      }

      if (status === 429) {
        errorMessage = data?.message || "Too many attempts. Please wait a few minutes and try again.";
      } else if (data?.message) {
        errorMessage = data.message;
      } else if (data?.error) {
        errorMessage = typeof data.error === "string" ? data.error : data.error.message;
      } else if (status === 404) {
        errorMessage = `Not found: ${responseConfig.method?.toUpperCase()} ${responseConfig.url}`;
      } else if (status >= 500) {
        errorMessage = "The server had a problem. Please try again.";
      } else if (status >= 400) {
        errorMessage = "Request failed. Please check your input.";
      }

      console.error("API Error:", { status, url: responseConfig.url, method: responseConfig.method, message: errorMessage });
    } else if (error.request) {
      errorMessage = SLEEPING_MESSAGE;
      console.error("Network error:", error.code, error.message);
    } else {
      errorMessage = error.message || "Failed to make request";
    }

    if (silentErrorDepth === 0) {
      toast.error(errorMessage);
    }

    return Promise.reject(Object.assign(new Error(errorMessage), { status: error.response?.status }));
  }
);

export default api;
