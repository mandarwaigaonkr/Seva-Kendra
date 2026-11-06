import { test } from "node:test";
import assert from "node:assert/strict";

import { createServerStatus, healthUrlFor, isHealthyResponse, looksLikeSleepingServer } from "../src/lib/serverStatus.js";
import { cacheKey, createRequestCache } from "../src/lib/requestCache.js";

/** A clock that only moves when sleep() is called. */
const fakeTime = () => {
  let t = 0;
  return { now: () => t, sleep: async (ms) => { t += ms; } };
};

test("server that answers straight away is ready after one check", async () => {
  const clock = fakeTime();
  const s = createServerStatus({ ping: async () => true, ...clock });
  assert.equal(await s.whenReady(), true);
  assert.equal(s.get().status, "ready");
  assert.equal(s.get().attempts, 1);
});

test("sleeping server: stays 'waking' and retries until it answers", async () => {
  const clock = fakeTime();
  let calls = 0;
  const seen = [];
  const s = createServerStatus({ ping: async () => ++calls >= 4, ...clock });
  s.subscribe((st) => seen.push(st.status));
  assert.equal(await s.whenReady(), true);
  assert.equal(calls, 4);
  assert.ok(seen.includes("waking"));
  assert.equal(s.get().status, "ready");
});

test("a ping that throws (network error) counts as not ready yet", async () => {
  const clock = fakeTime();
  let calls = 0;
  const s = createServerStatus({ ping: async () => { calls += 1; if (calls < 3) throw new Error("offline"); return true; }, ...clock });
  assert.equal(await s.whenReady(), true);
});

test("gives up as 'down' after the limit, and retry() starts again", async () => {
  const clock = fakeTime();
  let up = false;
  const s = createServerStatus({ ping: async () => up, ...clock, options: { giveUpAfterMs: 10000 } });
  assert.equal(await s.whenReady(), false);
  assert.equal(s.get().status, "down");
  up = true;
  assert.equal(await s.retry(), true);
  assert.equal(s.get().status, "ready");
});

test("many callers share one check", async () => {
  const clock = fakeTime();
  let calls = 0;
  const s = createServerStatus({ ping: async () => { calls += 1; return calls >= 2; }, ...clock });
  const results = await Promise.all([s.whenReady(), s.whenReady(), s.whenReady()]);
  assert.deepEqual(results, [true, true, true]);
  assert.equal(calls, 2);
});

test("recent 'ready' is trusted without pinging; a failed request re-checks", async () => {
  const clock = fakeTime();
  let calls = 0;
  const s = createServerStatus({ ping: async () => { calls += 1; return true; }, ...clock });
  await s.whenReady();
  await s.whenReady();
  assert.equal(calls, 1);
  await s.markUnreachable();
  assert.equal(calls, 2);
});

test("what counts as a sleeping server", () => {
  assert.equal(looksLikeSleepingServer({ request: {}, code: "ERR_NETWORK" }), true);
  assert.equal(looksLikeSleepingServer({ code: "ECONNABORTED" }), true);
  assert.equal(looksLikeSleepingServer({ code: "ERR_CANCELED" }), false);
  assert.equal(looksLikeSleepingServer({ response: { status: 503, headers: {} } }), true);
  assert.equal(looksLikeSleepingServer({ response: { status: 500, headers: { "content-type": "text/html" } } }), true);
  assert.equal(looksLikeSleepingServer({ response: { status: 500, headers: { "content-type": "application/json" } } }), false);
  assert.equal(looksLikeSleepingServer({ response: { status: 400, headers: {} } }), false);
  assert.equal(looksLikeSleepingServer({ response: { status: 401, headers: {} } }), false);
});

test("health URL is the server root", () => {
  assert.equal(healthUrlFor("https://api.example.org/api/v1"), "https://api.example.org/health");
  assert.equal(healthUrlFor("http://localhost:5000/api/v1/"), "http://localhost:5000/health");
  assert.equal(healthUrlFor("/api/v1"), "/health");
});

test("cache: repeated reads within the TTL hit memory; expired reads reload", async () => {
  let t = 0;
  const cache = createRequestCache({ ttlMs: 1000, now: () => t });
  let loads = 0;
  const load = async () => ++loads;
  assert.equal(await cache.fetch("a", load), 1);
  assert.equal(await cache.fetch("a", load), 1);
  t = 1500;
  assert.equal(await cache.fetch("a", load), 2);
});

test("cache: identical requests in flight share one load", async () => {
  const cache = createRequestCache();
  let loads = 0;
  let release;
  const gate = new Promise((r) => { release = r; });
  const load = async () => { loads += 1; await gate; return "x"; };
  const both = Promise.all([cache.fetch("k", load), cache.fetch("k", load)]);
  release();
  assert.deepEqual(await both, ["x", "x"]);
  assert.equal(loads, 1);
});

test("cache: clear() during a load means the stale answer is not stored", async () => {
  const cache = createRequestCache();
  let release;
  const gate = new Promise((r) => { release = r; });
  const pending = cache.fetch("k", async () => { await gate; return "old"; });
  cache.clear(); // a write happened meanwhile
  release();
  assert.equal(await pending, "old"); // the caller still gets its answer
  assert.equal(cache.size(), 0); // but it is not cached for anyone else
});

test("cache: a failed load is not cached", async () => {
  const cache = createRequestCache();
  await assert.rejects(cache.fetch("k", async () => { throw new Error("boom"); }));
  assert.equal(await cache.fetch("k", async () => "ok"), "ok");
});

test("cache key ignores param order and empty params", () => {
  assert.equal(cacheKey("/x", { b: 2, a: 1, c: "" }), cacheKey("/x", { a: 1, b: 2 }));
  assert.equal(cacheKey("/x", undefined), "/x");
});

test("a real request succeeding ends a running check (banner clears, no endless polling)", async () => {
  const clock = fakeTime();
  let calls = 0;
  let s;
  const ping = async () => {
    calls += 1;
    if (calls === 2) s.markReady(); // e.g. the sign-in request came back while we were checking
    return false; // the health check itself keeps failing
  };
  s = createServerStatus({ ping, ...clock });
  assert.equal(await s.whenReady(), true);
  assert.equal(s.get().status, "ready");
  assert.equal(calls, 2);
});

test("what counts as a healthy /health answer", () => {
  assert.equal(isHealthyResponse(200, { status: "ok", dbState: 1 }), true);
  assert.equal(isHealthyResponse(200, { status: "ok" }), true);
  assert.equal(isHealthyResponse(200, JSON.stringify({ status: "ok", dbState: 1 })), true);
  assert.equal(isHealthyResponse(200, { status: "ok", dbState: 2 }), false); // still connecting to the database
  assert.equal(isHealthyResponse(200, "<html>Service waking up</html>"), false); // the host's loading page
  assert.equal(isHealthyResponse(503, { status: "ok" }), false);
});
