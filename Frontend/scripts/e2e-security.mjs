#!/usr/bin/env node
/**
 * Security regression test against a RUNNING backend with a dev database.
 *
 *   node scripts/e2e-security.mjs      # API at http://localhost:5000/api/v1
 *   API_URL=… ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/e2e-security.mjs
 *
 * Checks the rules that keep sensitive records private:
 * - follow-ups (tracking) are scoped by domain permission: no permission → 403, Health-only
 *   user never sees an Education follow-up, cannot edit with view only, cannot rewrite
 *   identity fields (createdBy, module, recordId) through PATCH;
 * - completing a monthly follow-up schedules the next one;
 * - deleting a record closes its follow-ups;
 * - suspended or deleted users lose access on their next request (no token fallback);
 * - removed endpoints stay removed (dummy-login, register);
 * - operator injection and regex metacharacters in queries do not reach MongoDB;
 * - 500s do not leak internal error text; security headers are set.
 * Everything it creates is tagged SEC- and deleted at the end. Exit code 1 on any failure.
 */
const API = process.env.API_URL || "http://localhost:5000/api/v1";
const ADMIN = { email: process.env.ADMIN_EMAIL || "admin@sevakendra.com", password: process.env.ADMIN_PASSWORD || "Admin@123" };

const call = async (method, url, token, body, extraHeaders = {}) => {
  const res = await fetch(API + url, {
    method,
    headers: { "Content-Type": "application/json", ...extraHeaders, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json, headers: res.headers };
};

let failures = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg) => { failures += 1; console.log(`  ✗ ${msg}`); };
const expect = (cond, msg, detail = "") => (cond ? ok(msg) : bad(`${msg}${detail ? ` (${detail})` : ""}`));

const tag = `SEC-${Date.now().toString(36).toUpperCase()}`;
const cleanup = [];

const login = async ({ email, password }) => (await call("POST", "/auth/login", null, { email, password })).json?.data?.token;

const makeUser = async (adminToken, name, permissions) => {
  const email = `${tag.toLowerCase()}-${name}@example.test`;
  const password = "Secure@1234";
  const res = await call("POST", "/user", adminToken, {
    firstName: "Sec", lastName: name, email, password, role: "user", permissions,
  });
  const id = res.json?.data?._id || res.json?.data?.id;
  if (!id) throw new Error(`create user ${name}: ${res.status} ${res.json?.message}`);
  cleanup.push(() => call("DELETE", `/user/${id}`, adminToken));
  return { id, email, password, token: await login({ email, password }) };
};

const adminToken = await login(ADMIN);
if (!adminToken) {
  console.error("Admin login failed — is the backend running and the admin created?");
  process.exit(1);
}

try {
  console.log("■ removed and protected endpoints");
  expect((await call("POST", "/auth/dummy-login", null, { email: "admin@gmail.com", password: "admin123" })).status === 404, "dummy-login is gone");
  expect((await call("POST", "/auth/register", null, { email: `${tag}@x.test`, password: "x".repeat(10), role: "admin" })).status === 404, "public register is gone");
  expect((await call("GET", "/tracking", null)).status === 401, "tracking without token → 401");
  const verify = await call("GET", "/auth/verify", adminToken);
  expect(verify.status === 200 && verify.json?.data?.user?.role === "admin", "verify returns the current user");
  const shortPw = await call("POST", "/user", adminToken, { firstName: "S", lastName: "P", email: `${tag}-short@x.test`, password: "abc123", role: "user" });
  expect(shortPw.status === 400, "password under 8 characters is refused", shortPw.status);

  console.log("■ follow-up scoping by domain");
  const nobody = await makeUser(adminToken, "nobody", []);
  const healthViewer = await makeUser(adminToken, "healthview", ["health:view"]);
  const healthEditor = await makeUser(adminToken, "healthedit", ["health:view", "health:edit", "health:create"]);

  // A Health record and an Education record, each with its auto follow-up.
  const hiv = await call("POST", "/health/hiv", adminToken, {
    name: `${tag} Patient`, gender: "Male", age: 30, wardNo: "Ward 1", habitation: "Test",
    householdCode: `${tag}-H`, headOfHousehold: "Head", projectResponsible: "Test", reportedBy: "Test", dateOfReporting: new Date().toISOString().slice(0, 10),
  });
  const hivId = hiv.json?.data?._id;
  if (hivId) cleanup.push(() => call("DELETE", `/health/hiv/${hivId}`, adminToken));
  else console.log(`    (HIV create returned ${hiv.status}: ${hiv.json?.message}; using manual follow-ups only)`);

  const mkFollowUp = async (recordType, title) => {
    const res = await call("POST", "/tracking", adminToken, {
      recordType, recordId: "64b8f0f5f1d2c9a1b2c3d4e5", recordName: `${tag} ${recordType}`, title: `${tag} ${title}`,
      followUpDate: new Date(Date.now() - 86400000).toISOString(), module: "Health",
    });
    const id = res.json?.data?._id;
    if (!id) throw new Error(`create follow-up: ${res.status} ${res.json?.message}`);
    cleanup.push(() => call("DELETE", `/tracking/${id}`, adminToken));
    return res.json.data;
  };
  const health = await mkFollowUp("HIV", "health");
  const edu = await mkFollowUp("Dropouts", "education");
  expect(edu.module === "Education", "module comes from record type, not the request body", edu.module);

  expect((await call("GET", "/tracking", nobody.token)).status === 403, "no permissions → tracking list 403");
  expect((await call("GET", "/tracking/urgent-cases", nobody.token)).status === 403, "no permissions → urgent cases 403");
  expect((await call("GET", "/analytics/overview", nobody.token)).status === 403, "no permissions → analytics 403");
  expect((await call("PATCH", `/tracking/${health._id}`, nobody.token, { title: "x" })).status === 403, "no permissions → PATCH 403");
  expect((await call("DELETE", `/tracking/${health._id}`, nobody.token)).status === 403, "no permissions → DELETE 403");

  const list = await call("GET", `/tracking?search=${encodeURIComponent(tag)}&limit=100`, healthViewer.token);
  const modules = new Set((list.json?.data || []).map((t) => t.module));
  expect(list.status === 200 && modules.has("Health") && !modules.has("Education"), "health viewer sees Health follow-ups only", [...modules].join(","));
  expect((await call("GET", `/tracking/${edu._id}`, healthViewer.token)).status === 404, "health viewer cannot open an Education follow-up");
  expect((await call("GET", `/tracking?module=Education`, healthViewer.token)).json?.data?.length === 0, "filtering for another domain returns nothing");
  expect((await call("PATCH", `/tracking/${health._id}`, healthViewer.token, { title: "x" })).status === 403, "view-only cannot edit");
  expect((await call("POST", "/tracking", healthEditor.token, { recordType: "Dropouts", recordId: "64b8f0f5f1d2c9a1b2c3d4e5", recordName: "x", title: "x", followUpDate: new Date().toISOString() })).status === 403, "health creator cannot add an Education follow-up");

  const patch = await call("PATCH", `/tracking/${health._id}`, healthEditor.token, {
    title: `${tag} renamed`, createdBy: nobody.id, module: "Education", recordId: "64b8f0f5f1d2c9a1b2c3d4e6", recordName: "hijacked", isActive: false,
  });
  const after = patch.json?.data;
  expect(patch.status === 200 && after?.title === `${tag} renamed`, "editor can change the title");
  expect(after && after.module === "Health" && after.recordName === health.recordName && after.isActive === true && String(after.createdBy?._id || after.createdBy) !== nobody.id, "PATCH ignores identity fields", JSON.stringify({ m: after?.module, n: after?.recordName, a: after?.isActive }));
  expect((await call("PATCH", `/tracking/${edu._id}`, healthEditor.token, { title: "x" })).status === 404, "health editor cannot edit an Education follow-up");

  const overdue = await call("GET", `/tracking?isOverdue=true&search=${encodeURIComponent(tag)}`, adminToken);
  expect((overdue.json?.data || []).some((t) => t._id === health._id), "a follow-up past its due date is listed as overdue");

  console.log("■ monthly follow-ups recur; deletes close follow-ups");
  if (hivId) {
    // The auto follow-up is created in the background after the record is saved.
    let auto = null;
    for (let i = 0; i < 20 && !auto; i += 1) {
      await new Promise((r) => setTimeout(r, 150));
      auto = (await call("GET", `/tracking/record/HIV/${hivId}`, adminToken)).json?.data?.[0];
    }
    expect(Boolean(auto), "creating a record adds a monthly follow-up");
    if (auto) {
      const done = await call("POST", `/tracking/${auto._id}/complete`, adminToken, { notes: "visited" });
      const next = done.json?.next;
      expect(done.status === 200 && next && next.status === "Pending", "completing it schedules next month's follow-up");
      if (next) {
        const days = (new Date(next.followUpDate) - Date.now()) / 86400000;
        expect(days > 26 && days < 32, "next follow-up is about a month out", days.toFixed(1));
      }
      const cancel = await call("POST", `/tracking/${next?._id}/cancel`, adminToken, { reason: "test" });
      expect(cancel.status === 200 && cancel.json?.data?.monthlyUpdates?.some((u) => u.status === "Cancelled"), "cancelling keeps a history entry");
    }
    const hiv2 = await call("POST", "/health/hiv", adminToken, {
      name: `${tag} Patient2`, gender: "Female", age: 31, wardNo: "Ward 1", habitation: "Test",
      householdCode: `${tag}-H2`, headOfHousehold: "Head", projectResponsible: "Test", reportedBy: "Test", dateOfReporting: new Date().toISOString().slice(0, 10),
    });
    const hiv2Id = hiv2.json?.data?._id;
    if (hiv2Id) {
      await new Promise((r) => setTimeout(r, 600));
      await call("DELETE", `/health/hiv/${hiv2Id}`, adminToken);
      await new Promise((r) => setTimeout(r, 400));
      const left = (await call("GET", `/tracking/record/HIV/${hiv2Id}`, adminToken)).json?.data || [];
      expect(left.length === 0, "deleting a record closes its follow-ups", left.length);
    }
  }

  console.log("■ suspended and deleted users");
  const temp = await makeUser(adminToken, "temp", ["health:view"]);
  expect((await call("GET", "/health/hiv", temp.token)).status === 200, "active user can read");
  await call("PUT", `/user/${temp.id}`, adminToken, { status: "suspended" });
  expect((await call("GET", "/health/hiv", temp.token)).status === 403, "suspended user is cut off immediately");
  await call("DELETE", `/user/${temp.id}`, adminToken);
  expect((await call("GET", "/health/hiv", temp.token)).status === 401, "deleted user's token stops working");

  const promoted = await makeUser(adminToken, "promoted", ["health:view"]);
  await call("PUT", `/user/${promoted.id}`, adminToken, { role: "admin" });
  await call("PUT", `/user/${promoted.id}`, adminToken, { role: "user" });
  const demoted = (await call("GET", "/auth/verify", promoted.token)).json?.data?.user;
  expect(demoted?.role === "user" && !demoted.permissions.includes("users:delete"), "demoted admin loses admin permissions", demoted?.permissions?.length);

  console.log("■ query injection");
  const inj = await call("GET", "/health/hiv?gender[$ne]=nobody&limit=5", adminToken);
  expect(inj.status === 200, "operator in query string is not executed", inj.status);
  const paren = await call("GET", "/health/hiv?name=(", adminToken);
  expect(paren.status === 200, "search for '(' does not crash", paren.status);
  const paren2 = await call("GET", "/education/sc-students?search=(", adminToken);
  expect(paren2.status === 200, "education search for '(' does not crash", paren2.status);
  expect((await call("GET", "/education/study-centers?search=abc", adminToken)).status === 200, "study centre search (leader is a reference) does not crash");
  for (const q of ["page=-3", "limit=0", "limit=abc"]) {
    const r = await call("GET", `/health/hiv?${q}`, adminToken);
    expect(r.status === 200 && Number.isFinite(r.json?.data?.totalPages), `health list survives ${q}`, r.status);
  }
  const all = await call("GET", "/tracking?limit=0", adminToken);
  expect(all.json?.pagination?.limit >= 1 && all.json?.pagination?.limit <= 500, "tracking limit is clamped", all.json?.pagination?.limit);

  console.log("■ follow-up lifecycle: closed follow-ups stay closed, completing is atomic");
  let ridSeq = 0;
  const freshRid = () => `64b8f0f5f1d2c9a1b2c3${(0xd000 + (Date.now() % 0x2000) + (ridSeq += 1)).toString(16).padStart(4, "0")}`;
  const mkMonthly = async (label, extra = {}) => {
    const recordId = freshRid();
    const res = await call("POST", "/tracking", adminToken, {
      recordType: "HIV", recordId, recordName: `${tag} ${label}`, title: `${tag} ${label}`,
      followUpDate: new Date().toISOString(), category: "Monthly follow-up", ...extra,
    });
    const doc = res.json?.data;
    if (!doc?._id) throw new Error(`create ${label}: ${res.status} ${res.json?.message}`);
    cleanup.push(async () => {
      for (const t of (await call("GET", `/tracking/record/HIV/${recordId}`, adminToken)).json?.data || []) await call("DELETE", `/tracking/${t._id}`, adminToken);
      await call("DELETE", `/tracking/${doc._id}`, adminToken);
    });
    return { doc, recordId };
  };
  const openFor = async (recordId) => (await call("GET", `/tracking/record/HIV/${recordId}`, adminToken)).json?.data || [];

  // 20 simultaneous "Done" taps (double-click, two staff, retry after a slow response).
  let worst = { nexts: 1, open: 1 };
  for (let round = 0; round < 4; round += 1) { // the race is timing-dependent; a few rounds make it reliable
    const race = await mkMonthly(`race${round}`);
    const raced = await Promise.all(Array.from({ length: 20 }, () => call("POST", `/tracking/${race.doc._id}/complete`, adminToken, { notes: "c" })));
    const found = { nexts: raced.filter((r) => r.json?.next).length, open: (await openFor(race.recordId)).length };
    if (found.open > worst.open) worst = found;
  }
  expect(worst.open === 1, "20 concurrent completes schedule exactly one next follow-up", `nexts=${worst.nexts} open=${worst.open}`);

  const cancelled = await mkMonthly("cancelled");
  await call("POST", `/tracking/${cancelled.doc._id}/cancel`, adminToken, { reason: "r" });
  const revived = await call("POST", `/tracking/${cancelled.doc._id}/complete`, adminToken, {});
  expect(!revived.json?.next && revived.status >= 400, "a cancelled follow-up cannot be completed (no next one is scheduled)", `status=${revived.status} next=${Boolean(revived.json?.next)}`);

  const removed = await mkMonthly("removed");
  await call("DELETE", `/tracking/${removed.doc._id}`, adminToken);
  expect((await call("GET", `/tracking/${removed.doc._id}`, adminToken)).status === 404, "a deleted follow-up cannot be opened by id");
  expect((await call("PATCH", `/tracking/${removed.doc._id}`, adminToken, { title: "zombie" })).status === 404, "a deleted follow-up cannot be edited");
  const zombie = await call("POST", `/tracking/${removed.doc._id}/complete`, adminToken, {});
  expect(!zombie.json?.next, "completing a deleted follow-up does not schedule a new one", `status=${zombie.status}`);
  expect(((await call("GET", `/tracking/history/HIV/${removed.recordId}`, adminToken)).json?.data || []).length === 0, "history of a deleted follow-up is not listed");

  const viaPatch = await mkMonthly("viapatch");
  const patched = await call("PATCH", `/tracking/${viaPatch.doc._id}`, adminToken, { status: "Completed" });
  expect(patched.status >= 400 || patched.json?.data?.isActive === false, "PATCH status=Completed does not leave an active 'Completed' follow-up", `isActive=${patched.json?.data?.isActive}`);
  const viaUpdate = await mkMonthly("viaupdate");
  const updated = await call("POST", `/tracking/${viaUpdate.doc._id}/monthly-update`, adminToken, { notes: "n", status: "Completed" });
  expect(updated.status >= 400 || updated.json?.data?.isActive === false, "monthly-update status=Completed does not leave an active 'Completed' follow-up", `isActive=${updated.json?.data?.isActive}`);

  const done = await mkMonthly("reopen");
  await call("POST", `/tracking/${done.doc._id}/complete`, adminToken, {});
  const reopened = await call("PATCH", `/tracking/${done.doc._id}`, adminToken, { status: "Pending" });
  expect(reopened.status >= 400 || reopened.json?.data?.isActive === true, "a completed follow-up cannot become Pending while hidden (isActive=false)", `status=${reopened.json?.data?.status} isActive=${reopened.json?.data?.isActive}`);

  console.log("■ follow-up input validation");
  const target = await mkMonthly("validation");
  const mu = (body) => call("POST", `/tracking/${target.doc._id}/monthly-update`, adminToken, body);
  expect((await mu({ notes: "n", status: "Bogus" })).status === 400, "monthly-update invalid status → 400");
  expect((await mu({ notes: "n", date: "garbage" })).status === 400, "monthly-update invalid date → 400");
  expect((await mu({ notes: "n", status: { a: 1 } })).status === 400, "monthly-update object status → 400");
  const smuggle = await mu({ notes: "n", updatedBy: nobody.id });
  const entry = smuggle.json?.data?.monthlyUpdates?.slice(-1)[0];
  expect(String(entry?.updatedBy?._id || entry?.updatedBy) !== nobody.id, "monthly-update ignores a supplied updatedBy");
  const huge = await mu({ notes: "x".repeat(200000) });
  expect(huge.status === 400 || huge.status === 413, "a 200 KB follow-up note is refused (documents are capped at 16 MB)", huge.status);
  const manyTags = await call("PATCH", `/tracking/${target.doc._id}`, adminToken, { tags: Array.from({ length: 50000 }, (_, i) => `t${i}`) });
  expect(manyTags.status === 400, "50,000 tags on one follow-up are refused", manyTags.status);
  const ctor = await call("POST", "/tracking", adminToken, { recordType: "constructor", recordId: freshRid(), recordName: "x", title: "x", followUpDate: new Date().toISOString() });
  expect(ctor.status === 400 && !/function|native code/i.test(ctor.json?.message || ""), "recordType 'constructor' is a plain 400, not an inherited-property 403", `${ctor.status} ${ctor.json?.message}`);
  const stale = await call("GET", "/tracking/urgent-cases/alerts?staleAfterDays=abc", adminToken);
  expect(stale.status === 400 || Number.isFinite(stale.json?.staleAfterDays), "staleAfterDays=abc is rejected or echoed as a number (not null)", JSON.stringify(stale.json?.staleAfterDays));
  const created = await call("POST", "/tracking", adminToken, { recordType: "HIV", recordId: freshRid(), recordName: `${tag} done`, title: `${tag} done`, followUpDate: new Date().toISOString(), status: "Completed" });
  if (created.json?.data?._id) cleanup.push(() => call("DELETE", `/tracking/${created.json.data._id}`, adminToken));
  expect(created.status >= 400 || created.json?.data?.status !== "Completed", "a follow-up cannot be created already 'Completed'", `${created.status} ${created.json?.data?.status}`);

  console.log("■ edit without view");
  const editOnly = await makeUser(adminToken, "editonly", ["health:edit"]);
  const eoPatch = await call("PATCH", `/tracking/${target.doc._id}`, editOnly.token, { title: `${tag} eo` });
  expect(!eoPatch.json?.data?.recordName && !eoPatch.json?.data?.createdBy?.email, "edit-only user's PATCH response does not return the record (no health:view)", `leaked recordName=${eoPatch.json?.data?.recordName}`);
  const eoMu = await call("POST", `/tracking/${target.doc._id}/monthly-update`, editOnly.token, { notes: "n" });
  expect(!eoMu.json?.data?.monthlyUpdates, "edit-only user's monthly-update response does not return the note history", `entries=${eoMu.json?.data?.monthlyUpdates?.length}`);

  console.log("■ sessions after credential changes");
  const pw = await makeUser(adminToken, "pwchange", ["health:view"]);
  await call("PUT", `/user/${pw.id}`, adminToken, { password: "Changed@1234" });
  expect((await call("GET", "/auth/verify", pw.token)).status === 401, "a token issued before a password reset stops working");
  const spoof = [];
  for (let i = 0; i < 12; i += 1) spoof.push((await call("POST", "/auth/login", null, { email: `${tag.toLowerCase()}-ghost@example.test`, password: "wrong-password" }, { "X-Forwarded-For": `10.99.${i}.${i + 1}` })).status);
  expect(spoof.includes(429), "login rate limit cannot be dodged by rotating X-Forwarded-For", spoof.join(","));
  const out = await makeUser(adminToken, "logout", ["health:view"]);
  expect((await call("POST", "/auth/logout", out.token)).status === 200, "sign-out succeeds");
  expect((await call("GET", "/auth/verify", out.token)).status === 401, "a token stops working after sign-out");

  console.log("■ headers and errors");
  const res = await call("GET", "/", null);
  expect(!res.headers.get("x-powered-by"), "no X-Powered-By header");
  expect(Boolean(res.headers.get("x-content-type-options")), "helmet headers present");
  const badId = await call("GET", "/tracking/not-an-id", adminToken);
  expect(badId.status === 404, "malformed id → 404, not 500", badId.status);
} catch (error) {
  bad(`unexpected: ${error.message}`);
} finally {
  for (const undo of cleanup.reverse()) await undo().catch(() => {});
}

console.log(failures ? `\n${failures} check(s) failed` : "\nAll security checks passed");
process.exit(failures ? 1 : 0);
