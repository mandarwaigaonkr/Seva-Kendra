#!/usr/bin/env node
/**
 * End-to-end smoke test against a RUNNING backend (npm run dev) with a real database.
 *
 *   node scripts/e2e-smoke.mjs            # API at http://localhost:5000/api/v1
 *   API_URL=… ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/e2e-smoke.mjs
 *
 * 1. Logs in as admin.
 * 2. For every import template: builds the template workbook, fills the sample row, reads it back
 *    through the real parser (readWorkbookRows + parseSheet) and POSTs the payload — exactly what
 *    the import dialog does. Records created here get a "SMOKE-" prefix on their unique key and are
 *    deleted at the end.
 * 3. Creates a view-only user and checks the permission rules: view → 200, create → 403.
 *
 * SMOKE_KEEP=<file> skips cleanup and writes the created records to <file> (for visual checks);
 * SMOKE_CLEANUP=<file> deletes the records listed in <file> and exits.
 *
 * Exit code 1 on any failure. Writes to whatever database the backend uses — run it on a dev DB.
 */
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as XLSX from "xlsx";

import { parseSheet } from "../src/lib/excelImport/core.js";
import { buildTemplateWorkbook, readWorkbookRows } from "../src/lib/excelImport/workbook.js";

const API = process.env.API_URL || "http://localhost:5000/api/v1";
const ADMIN = { email: process.env.ADMIN_EMAIL || "admin@sevakendra.com", password: process.env.ADMIN_PASSWORD || "Admin@123" };
const here = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.resolve(here, "../src/lib/excelImport/templates");

// template file → API collection path (mirrors src/services/api.js)
const ENDPOINTS = {
  studyCenter: "/education/study-centers", teacher: "/education/teachers", groupLeader: "/education/group-leaders",
  scStudent: "/education/sc-students", dropout: "/education/dropouts", school: "/education/schools",
  competitiveExam: "/education/competitive-exams", boardPreparation: "/education/board-preparations",
  healthCamp: "/health/health-camps", elderly: "/health/elderly", motherChild: "/health/mother-child",
  pwd: "/health/pwd", adolescents: "/health/adolescents", tuberculosis: "/health/tuberculosis", hiv: "/health/hiv",
  leprosy: "/health/leprosy", addiction: "/health/addiction", otherDiseases: "/health/other-diseases",
  cbucboDetails: "/social-justice/cbucbo-details", entitlements: "/social-justice/entitlements",
  legalAidService: "/social-justice/legal-aid-service", workshopsAwareness: "/social-justice/workshops-awareness",
};

const call = async (method, url, token, body) => {
  const res = await fetch(API + url, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json };
};
const idOf = (json) => json?.data?._id || json?.data?.data?._id || json?.data?.id;
const tokenOf = (json) => json?.data?.token || json?.token || json?.data?.accessToken;

let failures = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg) => { failures += 1; console.log(`  ✗ ${msg}`); };

/** Run a template's sample row through the same path as the browser import. */
const samplePayload = (template) => {
  const book = buildTemplateWorkbook(template.fields, template.sampleRow);
  const sample = XLSX.utils.sheet_to_json(book.Sheets["Sample Data"], { header: 1, raw: false });
  XLSX.utils.sheet_add_aoa(book.Sheets.Data, [sample[1]], { origin: "A2" });
  const buffer = XLSX.write(book, { type: "array", bookType: "xlsx" });
  const sheet = readWorkbookRows(buffer, { fields: template.fields });
  const parsed = parseSheet(sheet.headers, sheet.rows, template.fields, { uniqueKeys: template.uniqueKeys, transform: template.transform });
  const row = parsed.rows[0];
  if (!row || row.errors.length) throw new Error(`sample row did not parse: ${JSON.stringify(row?.errors)}`);
  return row.payload;
};

// Make unique keys unique per run so the test can be repeated.
const tag = `SMOKE-${Date.now().toString(36).toUpperCase()}`;
const uniquify = (template, payload) => {
  for (const key of template.uniqueKeys || []) {
    const parts = key.split(".");
    let node = payload;
    for (let i = 0; i < parts.length - 1; i += 1) node = node?.[parts[i]];
    const leaf = parts[parts.length - 1];
    if (node && typeof node[leaf] === "string") node[leaf] = `${tag}-${node[leaf]}`;
  }
  return payload;
};

console.log(`API ${API}`);
const login = await call("POST", "/auth/login", null, ADMIN);
const adminToken = tokenOf(login.json);
if (!adminToken) {
  console.log(`Admin login failed (${login.status}): ${JSON.stringify(login.json)}`);
  process.exit(1);
}
console.log("■ admin login OK");

if (process.env.SMOKE_CLEANUP) {
  const { readFileSync, unlinkSync } = await import("node:fs");
  const list = JSON.parse(readFileSync(process.env.SMOKE_CLEANUP, "utf8"));
  let n = 0;
  for (const { endpoint, id } of list.reverse()) if ((await call("DELETE", `${endpoint}/${id}`, adminToken)).status < 300) n += 1;
  unlinkSync(process.env.SMOKE_CLEANUP);
  console.log(`  removed ${n}/${list.length} kept smoke records`);
  process.exit(0);
}

const created = [];
console.log("\n■ import every template's sample row");
// groupLeader first: studyCenter needs a real group leader id.
const files = readdirSync(templatesDir)
  .filter((f) => f.endsWith(".js"))
  .sort((x, y) => (x === "groupLeader.js" ? -1 : y === "groupLeader.js" ? 1 : x.localeCompare(y)));
let groupLeaderId = null;
for (const file of files) {
  const name = file.replace(/\.js$/, "");
  const template = (await import(pathToFileURL(path.join(templatesDir, file)).href)).default;
  const endpoint = ENDPOINTS[name];
  if (!endpoint) { bad(`${name}: no endpoint mapping`); continue; }
  try {
    let payload = uniquify(template, samplePayload(template));
    if (template.resolvedRefs?.length) {
      // studyCenter: the page resolves names to ids; do the same with a throwaway group leader.
      const { groupLeaderName, groupLeaderContact, teacherNames, teacherContacts, ...rest } = payload;
      payload = { ...rest, groupLeader: groupLeaderId, teachers: [] };
      if (!groupLeaderId) throw new Error("needs a group leader (groupLeader template must run first)");
    }
    const res = await call("POST", endpoint, adminToken, payload);
    const id = idOf(res.json);
    if (res.status >= 200 && res.status < 300 && id) {
      created.push({ endpoint, id });
      if (name === "groupLeader") groupLeaderId = id;
      const back = await call("GET", `${endpoint}/${id}`, adminToken);
      if (back.status === 200) ok(`${name}: created and read back`);
      else bad(`${name}: created but GET returned ${back.status}`);
    } else {
      bad(`${name}: ${res.status} ${res.json?.message || JSON.stringify(res.json)?.slice(0, 200)}`);
    }
  } catch (e) {
    bad(`${name}: ${e.message}`);
  }
}

console.log("\n■ permissions");
const email = `${tag.toLowerCase()}@example.com`;
const userRes = await call("POST", "/user", adminToken, {
  firstName: "Smoke", lastName: "Viewer", email, password: "Viewer@123", role: "user", status: "active",
  permissions: ["health:view", "education:view", "socialJustice:view"],
});
const viewerId = idOf(userRes.json);
if (!viewerId) bad(`create view-only user: ${userRes.status} ${userRes.json?.message}`);
else {
  const viewerLogin = await call("POST", "/auth/login", null, { email, password: "Viewer@123" });
  const viewerToken = tokenOf(viewerLogin.json);
  if (!viewerToken) bad(`view-only login: ${viewerLogin.status} ${viewerLogin.json?.message}`);
  else {
    for (const [name, endpoint] of [["addiction", ENDPOINTS.addiction], ["teacher", ENDPOINTS.teacher], ["legalAidService", ENDPOINTS.legalAidService]]) {
      const list = await call("GET", endpoint, viewerToken);
      list.status === 200 ? ok(`viewer can list ${name}`) : bad(`viewer list ${name}: ${list.status}`);
      const create = await call("POST", endpoint, viewerToken, {});
      create.status === 403 ? ok(`viewer create ${name} → 403`) : bad(`viewer create ${name}: expected 403, got ${create.status}`);
      const target = created.find((c) => c.endpoint === endpoint);
      if (target) {
        const del = await call("DELETE", `${endpoint}/${target.id}`, viewerToken);
        del.status === 403 ? ok(`viewer delete ${name} → 403`) : bad(`viewer delete ${name}: expected 403, got ${del.status}`);
      }
    }
  }
  await call("DELETE", `/user/${viewerId}`, adminToken);
}

if (process.env.SMOKE_KEEP) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(process.env.SMOKE_KEEP, JSON.stringify(created));
  console.log(`\n■ kept ${created.length} records (remove with SMOKE_CLEANUP=${process.env.SMOKE_KEEP})`);
  process.exit(failures ? 1 : 0);
}

console.log("\n■ cleanup");
let removed = 0;
for (const { endpoint, id } of created.reverse()) {
  const res = await call("DELETE", `${endpoint}/${id}`, adminToken);
  if (res.status < 300) removed += 1;
}
console.log(`  removed ${removed}/${created.length} smoke records`);

console.log(failures ? `\n${failures} failure(s)` : "\nAll smoke checks passed.");
process.exit(failures ? 1 : 0);
