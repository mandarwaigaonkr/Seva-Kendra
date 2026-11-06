import { test } from "node:test";
import assert from "node:assert/strict";

import { buildReport, fetchAllRecords, listFromResponse, statusBucket } from "../src/lib/reportData.js";

const hiv = [
  { name: "Asha", wardNo: "Ward 4", habitation: "Tiljala", dateOfReporting: "2026-03-10T00:00:00.000Z", overallStatus: "On ART" },
  { name: "Bina", wardNo: "4", habitation: "Topsia", dateOfReporting: "2026-04-02T00:00:00.000Z", overallStatus: "Treatment Completed" },
  { name: "Charu", wardNo: "Ward 7", habitation: "Tiljala", dateOfReporting: "2025-12-31T00:00:00.000Z", overallStatus: "Lost to Follow-up" },
];

test("finds the record list whatever the module calls it", () => {
  assert.equal(listFromResponse({ data: { hiv: [1, 2] } }).length, 2);
  assert.equal(listFromResponse({ data: { data: [1], pagination: {} } }).length, 1);
  assert.equal(listFromResponse({ data: { elderly: [], pagination: {} } }).length, 0);
});

test("health report counts real records (was always 0)", () => {
  const { report } = buildReport("hiv", hiv, { startDate: "2026-01-01", endDate: "2026-12-31" });
  assert.equal(report.summary.totalRecords, 2);
  assert.deepEqual(report.records.map((r) => r.name), ["Asha", "Bina"]);
  assert.equal(report.summary.completed, 1);
  assert.equal(report.summary.statusField, "overallStatus");
});

test("date range is inclusive and uses the reporting date", () => {
  assert.equal(buildReport("hiv", hiv, { startDate: "2025-12-31", endDate: "2025-12-31" }).report.summary.totalRecords, 1);
});

test("ward filter matches '4' and 'Ward 4'; name and habitation are case-insensitive", () => {
  assert.equal(buildReport("hiv", hiv, { wardNo: "4" }).report.summary.totalRecords, 2);
  assert.equal(buildReport("hiv", hiv, { name: "asha" }).report.summary.totalRecords, 1);
  assert.equal(buildReport("hiv", hiv, { habitation: "tilj" }).report.summary.totalRecords, 2);
});

test("status filter uses the same buckets as the badges", () => {
  assert.equal(statusBucket("Treatment Completed"), "completed");
  assert.equal(statusBucket("Lost to Follow-up"), "inactive");
  assert.equal(buildReport("hiv", hiv, { status: "inactive" }).report.summary.totalRecords, 1);
});

test("fetches every page", async () => {
  const all = Array.from({ length: 1200 }, (_, i) => ({ i }));
  const getAll = async ({ page, limit }) => ({
    data: { hiv: all.slice((page - 1) * limit, page * limit), totalPages: Math.ceil(all.length / limit) },
  });
  assert.equal((await fetchAllRecords(getAll)).length, 1200);
});

test("unknown category is an error, not an empty report", () => {
  assert.throws(() => buildReport("beneficiaries", []));
});

test("a record with an unreadable date is left out of a dated report instead of crashing it", () => {
  const rows = [...hiv, { name: "Junk", dateOfReporting: "not a date", overallStatus: "On ART" }];
  assert.equal(buildReport("hiv", rows, { startDate: "2026-01-01", endDate: "2026-12-31" }).report.summary.totalRecords, 2);
});
