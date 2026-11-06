// node --test scripts/test-record-data.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { statusTone, toApiPayload } from "../src/lib/recordData.js";

test("create payload drops blank fields so optional enums aren't sent as \"\"", () => {
  assert.deepEqual(
    toApiPayload({ name: "Asha", overallStatus: "", age: 0, active: false, address: { ward: "" } }),
    { name: "Asha", age: 0, active: false, address: {} }
  );
});

test("nested blanks are cleaned too (StudyCenter functionalAspects), arrays and dates untouched", () => {
  const date = new Date("2026-01-01");
  assert.deepEqual(
    toApiPayload({ functionalAspects: { infrastructureQuality: "", teacherAttendance: "Regular" }, teachers: ["", "a"], when: date }),
    { functionalAspects: { teacherAttendance: "Regular" }, teachers: ["", "a"], when: date }
  );
  assert.deepEqual(
    toApiPayload({ functionalAspects: { infrastructureQuality: "" } }, true),
    { functionalAspects: { infrastructureQuality: null } }
  );
});

test("update payload sends null for blanks so the field is cleared", () => {
  assert.deepEqual(toApiPayload({ name: "Asha", overallStatus: "" }, true), { name: "Asha", overallStatus: null });
});

test("negated statuses are not shown as success", () => {
  for (const v of ["Not Enrolled", "Not Qualified", "Not Receiving", "Not Linked", "Not Appeared", "Incomplete"]) {
    assert.equal(statusTone(v), "danger", v);
  }
});

test("absent-value statuses are neutral, not started is a warning", () => {
  for (const v of ["Not Applicable", "Not Available", "Not Assessed", "Not Provided", "Not Required", "None", "N/A", ""]) {
    assert.equal(statusTone(v), "neutral", v);
  }
  assert.equal(statusTone("Not Started"), "warning");
});

test("positive and in-flight statuses keep their tones", () => {
  assert.equal(statusTone("Completed"), "success");
  assert.equal(statusTone("Enrolled"), "success");
  assert.equal(statusTone("Approved"), "success");
  assert.equal(statusTone("Inactive"), "danger");
  assert.equal(statusTone("In Progress"), "warning");
  assert.equal(statusTone("In Process"), "warning");
  assert.equal(statusTone("Under Treatment"), "warning");
  assert.equal(statusTone("Lost to Follow-up"), "danger");
});

test("health outcomes: done is success, death and default are danger", () => {
  assert.equal(statusTone("Treatment Completed"), "success");
  assert.equal(statusTone("Cured"), "success");
  assert.equal(statusTone("Died"), "danger");
  assert.equal(statusTone("Defaulter"), "danger");
  assert.equal(statusTone("Under Treatment"), "warning");
  assert.equal(statusTone("Incomplete"), "danger");
  assert.equal(statusTone("Treatment Not Completed"), "danger");
});
