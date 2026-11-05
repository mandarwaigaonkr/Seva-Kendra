#!/usr/bin/env node
/**
 * Adversarial test-suite for the Excel import engine.
 *
 *   cd Frontend && node --test scripts/test-excel-import.mjs
 *
 * Every test builds a REAL workbook (xlsx / xls / csv) in memory with SheetJS and pushes it
 * through readWorkbookRows() + parseSheet(), exactly like the browser does.
 * Tests assert the CORRECT behaviour; a failing test is a bug in the engine, not in the test.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as XLSX from "xlsx";

import { parseSheet, excelSerialToYMD, parseDateString, coerceCell } from "../src/lib/excelImport/core.js";
import {
  readWorkbookRows,
  buildTemplateWorkbook,
  buildErrorWorkbook,
  isDateFormat,
} from "../src/lib/excelImport/workbook.js";
import addiction from "../src/lib/excelImport/templates/addiction.js";
import teacher from "../src/lib/excelImport/templates/teacher.js";

const here = path.dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Build a sheet from an array of rows. A value may be a plain JS value or a cell spec
 * { t, v, z, f, w } which is written verbatim (lets us set number formats, errors, formulas).
 */
const makeSheet = (aoa) => {
  const plain = aoa.map((row) => row.map((c) => (c && typeof c === "object" && !(c instanceof Date) && "t" in c ? null : c)));
  const ws = XLSX.utils.aoa_to_sheet(plain);
  let maxR = aoa.length - 1;
  let maxC = Math.max(0, ...aoa.map((r) => r.length - 1));
  aoa.forEach((row, r) =>
    row.forEach((c, col) => {
      if (c && typeof c === "object" && !(c instanceof Date) && "t" in c) {
        ws[XLSX.utils.encode_cell({ r, c: col })] = { ...c };
      }
    })
  );
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxR, c: maxC } });
  return ws;
};

const bookFrom = (sheets) => {
  const wb = XLSX.utils.book_new();
  for (const [name, aoa] of sheets) XLSX.utils.book_append_sheet(wb, Array.isArray(aoa) ? makeSheet(aoa) : aoa, name);
  return wb;
};

const toBuffer = (wb, bookType = "xlsx") => XLSX.write(wb, { type: "array", bookType });

const xlsx = (aoa, sheetName = "Data", bookType = "xlsx") => toBuffer(bookFrom([[sheetName, aoa]]), bookType);

/** Read + parse like the component does. */
const run = (data, fields, opts = {}, readOpts) => {
  const book = readWorkbookRows(data, readOpts);
  const parsed = parseSheet(book.headers, book.rows, fields, opts);
  return { book, parsed };
};

/** Single-column helper: one field, one value cell; returns the parsed row. */
const one = (field, cell, bookType = "xlsx") => {
  const f = { key: "x", label: "X", ...field };
  const { parsed } = run(xlsx([["X"], [cell]], "Data", bookType), [f]);
  const row = parsed.rows[0];
  return row ? { value: row.payload.x, errors: row.errors, row } : { value: undefined, errors: [], row: null, blank: true };
};

const dateCell = (serial, z) => ({ t: "n", v: serial, z });
const ok = (r, expected, msg) => {
  assert.deepEqual(r.errors.map((e) => e.message), [], msg || `unexpected errors`);
  assert.deepEqual(r.value, expected, msg);
};
const bad = (r, msg) => assert.ok(r.errors.length > 0, msg || `expected a validation error, got value ${JSON.stringify(r.value)}`);

const csvBytes = (str, bom = false) => {
  const b = new TextEncoder().encode(str);
  return bom ? new Uint8Array([0xef, 0xbb, 0xbf, ...b]) : b;
};

// A valid addiction row, keyed by template label (plain header names — no "*").
const ADD_HEADERS = ["Case ID", "Name", "Gender", "Age", "Head of Household", "Ward Number", "Habitation", "Project Responsible", "Date of Reporting", "Reported By"];
const addRow = (over = {}) => {
  const base = {
    "Case ID": "ADD-001", Name: "Raju", Gender: "Male", Age: 28, "Head of Household": "Mohan",
    "Ward Number": "Ward 4", Habitation: "Howrah", "Project Responsible": "Counselor B",
    "Date of Reporting": "15/08/2024", "Reported By": "FW E",
  };
  const merged = { ...base, ...over };
  return ADD_HEADERS.map((h) => merged[h]);
};

const D = { type: "date" };

// Serials (Excel 1900 system)
const S_2024_08_15 = 45519;
const S_2024_02_05 = 45327;

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

describe("dates: real Excel date cells", () => {
  const formats = ["d/m/yy", "m/d/yyyy", "dd-mmm-yyyy", "dd/mm/yyyy", "[$-409]d-mmm-yy;@", "[$-4009]dd-mm-yyyy", "dd/mm/yyyy hh:mm", "yyyy-mm-dd", "mmmm d, yyyy", "m/d/yy" /* built-in id 14 */];
  for (const z of formats) {
    test(`format ${JSON.stringify(z)} → 2024-08-15`, () => {
      ok(one(D, dateCell(S_2024_08_15, z)), "2024-08-15");
    });
  }
  test("date+time cell (serial .75) keeps the calendar day", () => ok(one(D, dateCell(S_2024_08_15 + 0.75, "dd/mm/yyyy hh:mm")), "2024-08-15"));
  test("date serial in a General cell", () => ok(one(D, { t: "n", v: S_2024_08_15 }), "2024-08-15"));
  test("isDateFormat sanity", () => {
    assert.equal(isDateFormat("General"), false);
    assert.equal(isDateFormat("0.00E+00"), false);
    assert.equal(isDateFormat('#,##0 "days"'), false);
    assert.equal(isDateFormat("[$₹-4009] #,##0.00"), false);
    assert.equal(isDateFormat("#,##0_);[Red](#,##0)"), false);
    assert.equal(isDateFormat("[$-409]d-mmm-yy;@"), true);
    assert.equal(isDateFormat("yyyy\\-mm\\-dd"), true);
    assert.equal(isDateFormat(14), true);
  });
  test("a bare year typed in a General cell (2024) is NOT silently turned into 1905-07-16", () => {
    bad(one(D, { t: "n", v: 2024 }), "2024 in a date column must be rejected, not stored as 1905-07-16");
  });
});

describe("dates: 1900 leap-year bug", () => {
  test("serial 1 = 1900-01-01", () => assert.equal(excelSerialToYMD(1), "1900-01-01"));
  test("serial 59 = 1900-02-28", () => assert.equal(excelSerialToYMD(59), "1900-02-28"));
  test("serial 61 = 1900-03-01", () => assert.equal(excelSerialToYMD(61), "1900-03-01"));
  test("serial 60 (Excel's fictitious 29-Feb-1900) is rejected, not duplicated onto 1900-03-01", () =>
    assert.equal(excelSerialToYMD(60), null));
});

describe("dates: text cells", () => {
  const cases = [
    ["15/08/2024", "2024-08-15"],
    ["08/15/2024", "2024-08-15"], // impossible day-first → month-first fallback
    ["2024-8-5", "2024-08-05"],
    ["15.08.24", "2024-08-15"],
    ["15 Aug 2024", "2024-08-15"],
    ["Aug 15, 2024", "2024-08-15"],
    ["15-Aug-2024", "2024-08-15"],
    ["15th August 2024", "2024-08-15"],
    ["29/02/2024", "2024-02-29"],
    ["5/8/2024", "2024-08-05"], // Indian convention: day first
    [" 15/08/2024 ", "2024-08-15"],
    ["15/08/2024 10:30", "2024-08-15"],
  ];
  for (const [input, expected] of cases) test(`"${input}" → ${expected}`, () => ok(one(D, input), expected));
  for (const input of ["31/02/2024", "29/02/2023", "32/01/2024", "15/13/2024", "August 2024", "yesterday", "15/08"]) {
    test(`"${input}" is rejected`, () => bad(one(D, input)));
  }
  test("two-digit years follow Excel's 2029 pivot: 01/01/45 → 1945-01-01 (birth dates!)", () =>
    ok(one(D, "01/01/45"), "1945-01-01"));
  test("two-digit years: 12/03/55 → 1955-03-12", () => assert.equal(parseDateString("12/03/55"), "1955-03-12"));
  test("two-digit years: 01/01/29 → 2029-01-01", () => assert.equal(parseDateString("01/01/29"), "2029-01-01"));
  test("'N/A' / '-' in an optional date column counts as blank", () => {
    assert.equal(one(D, "N/A").errors.length, 0);
    assert.equal(one(D, "-").errors.length, 0);
  });
});

describe("dates: CSV (SheetJS guesses dates in CSV with US m/d order)", () => {
  const csvDate = (s, bom = true) => {
    const { parsed } = run(csvBytes(`X\n${s}\n`, bom), [{ key: "x", label: "X", type: "date" }]);
    return { value: parsed.rows[0].payload.x, errors: parsed.rows[0].errors };
  };
  test('CSV "15/08/2024" → 2024-08-15', () => ok(csvDate("15/08/2024"), "2024-08-15"));
  test('CSV "05/08/2024" is 5 August (DD/MM), not 8 May', () => ok(csvDate("05/08/2024"), "2024-08-05"));
  test('CSV "01/02/2024" is 1 February, not 2 January', () => ok(csvDate("01/02/2024"), "2024-02-01"));
  test('CSV "2024-08-05" → 2024-08-05', () => ok(csvDate("2024-08-05"), "2024-08-05"));
});

describe("dates: timezone independence (child processes)", () => {
  const coreUrl = pathToFileURL(path.resolve(here, "../src/lib/excelImport/core.js")).href;
  const wbUrl = pathToFileURL(path.resolve(here, "../src/lib/excelImport/workbook.js")).href;
  const script = `
    import * as XLSX from "xlsx";
    import { parseSheet } from ${JSON.stringify(coreUrl)};
    import { readWorkbookRows } from ${JSON.stringify(wbUrl)};
    const F = [{ key: "x", label: "X", type: "date" }];
    const val = (data) => { const b = readWorkbookRows(data); const p = parseSheet(b.headers, b.rows, F); return p.rows.map(r => r.errors.length ? "ERR" : r.payload.x); };
    const out = {};
    // 1. a workbook whose dates were written as JS Date objects (how Google Sheets/other tools export)
    const ws = XLSX.utils.aoa_to_sheet([["X"], [new Date(2024, 7, 15)], [new Date(2024, 0, 1)], [new Date(2024, 11, 31)]], { cellDates: false });
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Data");
    out.jsDate = val(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
    // 2. serial cells
    const ws2 = XLSX.utils.aoa_to_sheet([["X"], [45519]]); ws2.A2.z = "dd/mm/yyyy";
    const wb2 = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb2, ws2, "Data");
    out.serial = val(XLSX.write(wb2, { type: "array", bookType: "xlsx" }));
    // 3. CSV text dates
    out.csv = val(new TextEncoder().encode("\\uFEFFX\\n2024-08-05\\n15/08/2024\\n05/08/2024\\n"));
    console.log(JSON.stringify(out));
  `;
  for (const tz of ["Asia/Kolkata", "America/Los_Angeles", "Pacific/Kiritimati"]) {
    test(`round-trip under TZ=${tz}`, () => {
      const res = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
        cwd: path.resolve(here, ".."),
        env: { ...process.env, TZ: tz },
        encoding: "utf8",
      });
      assert.equal(res.status, 0, res.stderr);
      const out = JSON.parse(res.stdout.trim().split("\n").pop());
      assert.deepEqual(out.serial, ["2024-08-15"], "serial cell");
      // In UTC+14 SheetJS's own writer (datenum) is off by one — that's upstream, not the reader.
      if (tz !== "Pacific/Kiritimati") assert.deepEqual(out.jsDate, ["2024-08-15", "2024-01-01", "2024-12-31"], "JS-Date written workbook");
      assert.deepEqual(out.csv, ["2024-08-05", "2024-08-15", "2024-08-05"], "CSV text dates");
    });
  }
});

/* ------------------------------------------------------------------ */
/* Numbers                                                             */
/* ------------------------------------------------------------------ */

describe("numbers", () => {
  const INT = { type: "integer", min: 0, max: 120 };
  const NUM = { type: "number", min: 0 };
  test('"1,200" → 1200', () => ok(one(NUM, "1,200"), 1200));
  test('"1,20,000" (Indian grouping) → 120000', () => ok(one(NUM, "1,20,000"), 120000));
  test('"₹500" → 500', () => ok(one(NUM, "₹500"), 500));
  test('"₹ 1,200.50" → 1200.5', () => ok(one(NUM, "₹ 1,200.50"), 1200.5));
  test('" 28 " → 28', () => ok(one(INT, " 28 "), 28));
  test("28.0 numeric cell for integer → 28", () => ok(one(INT, { t: "n", v: 28.0 }), 28));
  test('"28.0" text for integer → 28', () => ok(one(INT, "28.0"), 28));
  test("28.5 for integer is rejected", () => bad(one(INT, 28.5)));
  test("formula float noise 28.000000000000004 for integer → 28 (Excel shows 28)", () =>
    ok(one(INT, { t: "n", v: 28.000000000000004, f: "0.1*280" }), 28));
  test("number field stores what Excel shows: 0.1+0.2 → 0.3", () => ok(one(NUM, { t: "n", v: 0.1 + 0.2 }), 0.3));
  test("negative below min is rejected", () => bad(one(INT, -5)));
  test('"twenty" is rejected', () => bad(one(INT, "twenty")));
  test('"0x1A" is rejected (not silently 26)', () => bad(one(NUM, "0x1A")));
  test("number displayed in scientific (9.87654E+09) keeps the full value", () =>
    ok(one(NUM, { t: "n", v: 9876543210, z: "0.00E+00" }), 9876543210));
  test("age 150 > max is rejected", () => bad(one(INT, 150)));
});

/* ------------------------------------------------------------------ */
/* Phones                                                              */
/* ------------------------------------------------------------------ */

describe("phones", () => {
  const P = { type: "phone" };
  const good = [
    ["+91 98765 43210", "9876543210"],
    ["+91-98765-43210", "9876543210"],
    ["0091 98765 43210", "9876543210"],
    ["091-9876543210", "9876543210"],
    ["09876543210", "9876543210"],
    ["919876543210", "9876543210"],
    ["98765-43210", "9876543210"],
    ["(98765) 43210", "9876543210"],
  ];
  for (const [input, expected] of good) test(`"${input}" → ${expected}`, () => ok(one(P, input), expected));
  test("numeric cell 9876543210", () => ok(one(P, { t: "n", v: 9876543210 }), "9876543210"));
  test("numeric cell shown as 9.88E+09 keeps all digits", () => ok(one(P, { t: "n", v: 9876543210, z: "0.00E+00", w: "9.88E+09" }), "9876543210"));
  test("numeric cell 919876543210", () => ok(one(P, { t: "n", v: 919876543210 }), "9876543210"));
  test('10 digits starting with 5 is rejected', () => bad(one(P, "5876543210")));
  test('landline "080-23456789" (Bengaluru STD) is rejected, not stored as mobile 8023456789', () =>
    bad(one(P, "080-23456789")));
  test('landline "079 2345 6789" (Ahmedabad) is rejected', () => bad(one(P, "079 2345 6789")));
  test('landline "022-23456789" is rejected', () => bad(one(P, "022-23456789")));
  test("two numbers in one cell are not merged into a garbage number", () => {
    const r = one(P, "9876543210 / 9123456789");
    if (!r.errors.length) assert.equal(r.value, "9876543210");
  });
  test('CSV text "9.87654E+09" (copied display text) is rejected, not stored as 9876540000', () => {
    const { parsed } = run(csvBytes("X\n9.87654E+09\n", true), [{ key: "x", label: "X", type: "phone" }]);
    assert.ok(parsed.rows[0].errors.length > 0, `got ${parsed.rows[0].payload.x}`);
  });
  test("'N/A' in optional phone is blank", () => assert.equal(one(P, "N/A").errors.length, 0));
});

/* ------------------------------------------------------------------ */
/* Enums / multiEnum / booleans / text                                 */
/* ------------------------------------------------------------------ */

describe("enums", () => {
  const fieldsBy = Object.fromEntries(addiction.fields.map((f) => [f.key, f]));
  const G = { ...fieldsBy.gender };
  const ST = { ...fieldsBy.overallStatus };
  const SK = { ...fieldsBy.statusOfLinkageWithSkillDevelopment };
  const pick = (field, v) => {
    const { parsed } = run(xlsx([[field.label], [v]]), [field]);
    return { value: parsed.rows[0].payload[field.key], errors: parsed.rows[0].errors };
  };
  for (const [v, exp] of [["male", "Male"], [" MALE ", "Male"], ["M", "Male"], ["f", "Female"], ["Female.", "Female"]]) {
    test(`gender "${v}" → ${exp}`, () => ok(pick(G, v), exp));
  }
  for (const [v, exp] of [["lost to follow up", "Lost to Follow-up"], ["Lost-to-followup", "Lost to Follow-up"], ["LTFU", "Lost to Follow-up"], ["rehab", "In Rehabilitation"]]) {
    test(`status "${v}" → ${exp}`, () => ok(pick(ST, v), exp));
  }
  test('"linked" → Linked (not Not Linked)', () => ok(pick(SK, "linked"), "Linked"));
  test('"not linked" → Not Linked', () => ok(pick(SK, "not linked"), "Not Linked"));
  test('"inprogress" → In Progress', () => ok(pick(SK, "inprogress"), "In Progress"));
  test('"Others" → Other (common Indian-English plural)', () => ok(pick(G, "Others"), "Other"));
  test('"Transgender" is rejected', () => bad(pick(G, "Transgender")));
  test("required enum blank → is required", () => {
    const { parsed } = run(xlsx([["Gender", "Other col"], [null, "x"]]), [G]);
    assert.ok(parsed.rows[0].errors.some((e) => /required/.test(e.message)));
  });
  test('required enum "N/A" → rejected', () => bad(pick(G, "N/A")));
  test('OPTIONAL enum "N/A" is treated as blank (row must not be rejected)', () => {
    const r = pick(ST, "N/A");
    assert.deepEqual(r.errors, []);
    assert.equal(r.value, undefined);
  });
  test('OPTIONAL enum "-" is treated as blank', () => assert.deepEqual(pick(ST, "-").errors, []));
});

describe("multiEnum", () => {
  const SP = teacher.fields.find((f) => f.key === "specialization");
  const pick = (v) => {
    const { parsed } = run(xlsx([["Specialization"], [v]]), [SP]);
    return { value: parsed.rows[0].payload.specialization, errors: parsed.rows[0].errors };
  };
  for (const sep of [", ", ";", " | ", "\n", ","]) {
    test(`separator ${JSON.stringify(sep)}`, () => ok(pick(`Maths${sep}Science`), ["Mathematics", "Science"]));
  }
  test('separator "/" (Maths/Science)', () => ok(pick("Maths/Science"), ["Mathematics", "Science"]));
  test("duplicates collapse", () => ok(pick("Maths, Mathematics, maths"), ["Mathematics"]));
  test("one bad value is reported", () => bad(pick("Maths, Dance")));
});

describe("booleans and text fields", () => {
  const B = { type: "boolean" };
  for (const [v, exp] of [["Yes", true], ["No", false], ["Y", true], ["n", false], ["yes ", true], ["YES.", true], [1, true], [0, false], [{ t: "b", v: true }, true], [{ t: "b", v: false }, false], ["TRUE", true]]) {
    test(`boolean ${JSON.stringify(v)} → ${exp}`, () => ok(one(B, v), exp));
  }
  test('boolean "maybe" rejected', () => bad(one(B, "maybe")));
  const T = { type: "text" };
  for (const [v, exp] of [["1", "1"], ["no", "no"], ["Yes", "Yes"], [{ t: "b", v: true }, "TRUE"], ["0", "0"], ["N/A", "N/A"]]) {
    test(`text field keeps ${JSON.stringify(v)} as text ${JSON.stringify(exp)}`, () => ok(one(T, v), exp));
  }
  test("text field: rich text cell → plain text", () =>
    ok(one(T, { t: "s", v: "Raju Sharma", r: "<r><rPr><b/></rPr><t>Raju</t></r><r><t> Sharma</t></r>", h: "<b>Raju</b> Sharma" }), "Raju Sharma"));
  test("text field: 30k-char text survives", () => {
    const long = "a".repeat(30000);
    ok(one(T, long), long);
  });
  test("text field: NBSP inside value normalised", () => ok(one(T, "Raju Sharma "), "Raju Sharma"));
  test("required text field with a placeholder (\"-\" / \"N/A\") counts as missing", () => {
    const { parsed } = run(xlsx([["Name", "Other"], ["-", "x"], ["N/A", "y"]]), [{ key: "name", label: "Name", type: "text", required: true }]);
    for (const r of parsed.rows) assert.ok(r.errors.some((e) => /required/.test(e.message)), `row ${r.rowNumber} accepted ${r.payload.name}`);
  });
});

/* ------------------------------------------------------------------ */
/* Ward                                                                */
/* ------------------------------------------------------------------ */

describe("ward", () => {
  const W = { type: "ward" };
  for (const [v, exp] of [[4, "Ward 4"], ["4", "Ward 4"], ["Ward 4", "Ward 4"], ["ward no. 4", "Ward 4"], ["W-4", "Ward 4"], ["Ward 04", "Ward 4"], ["Ward No: 12", "Ward 12"], ["WARD-7", "Ward 7"], [{ t: "n", v: 4.0 }, "Ward 4"]]) {
    test(`ward ${JSON.stringify(v)} → ${exp}`, () => ok(one(W, v), exp));
  }
  test("plain format", () => ok(one({ type: "ward", wardFormat: "plain" }, "Ward 04"), "4"));
  test("0 rejected", () => bad(one(W, 0)));
  test('"Ward A" rejected', () => bad(one(W, "Ward A")));
  test("4.5 rejected", () => bad(one(W, 4.5)));
  test("999 rejected when max is set", () => bad(one({ type: "ward", max: 200 }, 999)));
});

/* ------------------------------------------------------------------ */
/* Headers                                                             */
/* ------------------------------------------------------------------ */

describe("headers", () => {
  const F = addiction.fields;
  test("template headers with ' *' resolve; nothing missing", () => {
    const { parsed } = run(xlsx([ADD_HEADERS.map((h) => `${h} *`), addRow()]), F);
    assert.deepEqual(parsed.missingRequired, []);
    assert.deepEqual(parsed.unknownHeaders, []);
    assert.equal(parsed.validRows.length, 1, JSON.stringify(parsed.rows[0]?.errors));
  });
  test("extra spaces, NBSP, case, trailing '*' with spaces", () => {
    const messy = ADD_HEADERS.map((h, i) => [`  ${h.toUpperCase()}  `, h.replace(/ /g, " "), `${h.toLowerCase()} * `, ` ${h}*`][i % 4]);
    const { parsed } = run(xlsx([messy, addRow()]), F);
    assert.deepEqual(parsed.missingRequired, []);
    assert.equal(parsed.validRows.length, 1, JSON.stringify(parsed.rows[0]?.errors));
  });
  test("headerAliases (Ward No / Mobile / Contact No.)", () => {
    const { parsed } = run(xlsx([[...ADD_HEADERS.slice(0, 5), "Ward No", ...ADD_HEADERS.slice(6), "Mobile"], [...addRow(), "9876543210"]]), F);
    assert.deepEqual(parsed.missingRequired, []);
    assert.equal(parsed.rows[0].payload.contactNo, "9876543210");
    assert.equal(parsed.rows[0].payload.wardNo, "Ward 4");
  });
  test("unknown columns reported, not fatal", () => {
    const { parsed } = run(xlsx([[...ADD_HEADERS, "Remarks"], [...addRow(), "hello"]]), F);
    assert.deepEqual(parsed.unknownHeaders, ["Remarks"]);
    assert.equal(parsed.validRows.length, 1);
  });
  test("missing required columns listed", () => {
    const { parsed } = run(xlsx([ADD_HEADERS.slice(2), addRow().slice(2)]), F);
    assert.deepEqual(parsed.missingRequired.sort(), ["Case ID", "Name"]);
    assert.equal(parsed.validRows.length, 0);
  });
  test("columns out of order", () => {
    const order = [...ADD_HEADERS.keys()].reverse();
    const { parsed } = run(xlsx([order.map((i) => ADD_HEADERS[i]), order.map((i) => addRow()[i])]), F);
    assert.equal(parsed.validRows.length, 1);
    assert.equal(parsed.rows[0].payload.caseId, "ADD-001");
  });
  test("trailing empty header columns are ignored", () => {
    const { book, parsed } = run(xlsx([[...ADD_HEADERS, null, null], [...addRow(), null, null]]), F);
    assert.equal(book.headers.length, ADD_HEADERS.length);
    assert.equal(parsed.validRows.length, 1);
  });
  test("header not on row 1 (blank rows above) → rowNumber still real", () => {
    const { parsed } = run(xlsx([[], [], ADD_HEADERS, addRow()]), F);
    assert.equal(parsed.validRows.length, 1);
    assert.equal(parsed.rows[0].rowNumber, 4);
  });
  test("merged title row above the headers is skipped (header row = row that matches the template)", () => {
    const ws = makeSheet([["Addiction Records — Ward 4, 2024"], [], ADD_HEADERS, addRow()]);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: ADD_HEADERS.length - 1 } }];
    const buf = toBuffer(bookFrom([["Data", ws]]));
    const book = readWorkbookRows(buf, { fields: F }); // the reader needs the template to find the header row
    const parsed = parseSheet(book.headers, book.rows, F);
    assert.deepEqual(parsed.missingRequired, []);
    assert.equal(parsed.validRows.length, 1);
    assert.equal(parsed.rows[0].rowNumber, 4);
  });
  test("duplicate column: flagged, first non-blank wins", () => {
    const { parsed } = run(xlsx([[...ADD_HEADERS, "Name"], [...addRow(), "Other Name"]]), F);
    assert.deepEqual(parsed.duplicateHeaders, ["Name"]);
    assert.equal(parsed.rows[0].payload.name, "Raju");
  });
  test("duplicate column: error report keeps BOTH original values", () => {
    const { parsed } = run(xlsx([[...ADD_HEADERS, "Name"], [...addRow({ Age: "abc" }), "Other Name"]]), F);
    const failed = parsed.invalidRows.map((r) => ({ rowNumber: r.rowNumber, raw: r.raw, message: "x" }));
    const report = XLSX.read(toBuffer(buildErrorWorkbook(readWorkbookRows(xlsx([[...ADD_HEADERS, "Name"]])).headers, failed)), { type: "array" });
    const aoa = XLSX.utils.sheet_to_json(report.Sheets[report.SheetNames[0]], { header: 1 });
    const nameCols = aoa[0].map((h, i) => (h === "Name" ? i : -1)).filter((i) => i >= 0);
    assert.deepEqual(nameCols.map((i) => aoa[1][i]), ["Raju", "Other Name"]);
  });
});

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

describe("rows", () => {
  const F = addiction.fields;
  test("blank and whitespace-only rows in the middle are skipped; row numbers stay real", () => {
    const { parsed } = run(xlsx([ADD_HEADERS, addRow({ "Case ID": "A1" }), [], ["  ", " ", " "], addRow({ "Case ID": "A2", Age: "x" })]), F);
    assert.deepEqual(parsed.rows.map((r) => r.rowNumber), [2, 5]);
    assert.equal(parsed.invalidRows[0].rowNumber, 5);
  });
  test("formula cells use their cached value", () => {
    const { parsed } = run(xlsx([ADD_HEADERS, addRow({ Age: { t: "n", v: 30, f: "25+5" }, Name: { t: "s", v: "Raju S", f: 'CONCAT("Raju"," S")' } })]), F);
    assert.equal(parsed.rows[0].payload.age, 30);
    assert.equal(parsed.rows[0].payload.name, "Raju S");
  });
  test("error cell #N/A in a required column is reported as a formula error, not 'is required'", () => {
    const { parsed } = run(xlsx([ADD_HEADERS, addRow({ Name: { t: "e", v: 0x2a, w: "#N/A" } })]), F);
    const err = parsed.rows[0].errors.find((e) => e.field === "name");
    assert.ok(err, "row should be rejected");
    assert.match(err.message, /#N\/A|formula|error/i);
  });
  test("error cell #REF! in an OPTIONAL column is not silently dropped", () => {
    const { parsed } = run(xlsx([[...ADD_HEADERS, "Occupation"], [...addRow(), { t: "e", v: 0x17, w: "#REF!" }]]), F);
    assert.ok(parsed.rows[0].errors.some((e) => e.field === "occupation"), "a #REF! cell should be flagged");
  });
  test("duplicate unique keys (case / whitespace variants) are flagged", () => {
    const { parsed } = run(xlsx([ADD_HEADERS, addRow({ "Case ID": "ADD-001" }), addRow({ "Case ID": " add-001 " }), addRow({ "Case ID": "ADD-002" })]), F, { uniqueKeys: ["caseId"] });
    assert.deepEqual(parsed.invalidRows.map((r) => r.rowNumber), [3]);
    assert.match(parsed.invalidRows[0].errors[0].message, /row 2/);
  });
  test("dot-key nesting", () => {
    const fields = [{ key: "address.city", label: "City" }, { key: "address.pin", label: "PIN", type: "integer" }, { key: "name", label: "Name" }];
    const { parsed } = run(xlsx([["Name", "City", "PIN"], ["A", "Pune", 411001]]), fields);
    assert.deepEqual(parsed.rows[0].payload, { name: "A", address: { city: "Pune", pin: 411001 } });
  });
  test("5000 rows parse in < 3 s", () => {
    const aoa = [ADD_HEADERS];
    for (let i = 0; i < 5000; i++) aoa.push(addRow({ "Case ID": `ADD-${i}`, "Date of Reporting": dateCell(S_2024_08_15, "dd/mm/yyyy") }));
    const buf = xlsx(aoa);
    const t0 = performance.now();
    const { parsed } = run(buf, F, { uniqueKeys: ["caseId"] });
    const ms = performance.now() - t0;
    assert.equal(parsed.validRows.length, 5000);
    assert.ok(ms < 3000, `took ${ms.toFixed(0)} ms`);
  });
  test("bloated used-range (A1:Z1048576, e.g. whole columns formatted) with 3 rows reads in < 3 s", () => {
    const ws = makeSheet([ADD_HEADERS, addRow()]);
    ws["!ref"] = "A1:Z1048576";
    const buf = toBuffer(bookFrom([["Data", ws]]));
    const t0 = performance.now();
    const { parsed } = run(buf, F);
    const ms = performance.now() - t0;
    assert.equal(parsed.rows.length, 1);
    assert.ok(ms < 3000, `took ${ms.toFixed(0)} ms`);
  });
});

/* ------------------------------------------------------------------ */
/* Sheets / file types / round trips                                   */
/* ------------------------------------------------------------------ */

describe("sheets and file types", () => {
  const F = addiction.fields;
  test("first sheet 'Instructions' → data sheet is picked", () => {
    const buf = toBuffer(bookFrom([["Instructions", [["How to"], ["Fill it"]]], ["Sheet1", [ADD_HEADERS, addRow()]]]));
    const { book, parsed } = run(buf, F);
    assert.equal(book.sheetName, "Sheet1");
    assert.equal(parsed.validRows.length, 1);
  });
  test("template downloaded then re-uploaded unchanged → 0 rows, no errors", () => {
    const buf = toBuffer(buildTemplateWorkbook(F, addiction.sampleRow));
    const { book, parsed } = run(buf, F);
    assert.equal(book.sheetName, "Data");
    assert.equal(parsed.rows.length, 0);
    assert.deepEqual(parsed.missingRequired, []);
    assert.deepEqual(parsed.unknownHeaders, []);
  });
  test("template filled in → valid row", () => {
    const tpl = buildTemplateWorkbook(F, addiction.sampleRow);
    const sample = XLSX.utils.sheet_to_json(tpl.Sheets["Sample Data"], { header: 1 });
    XLSX.utils.sheet_add_aoa(tpl.Sheets.Data, [sample[1]], { origin: "A2" });
    const { parsed } = run(toBuffer(tpl), F);
    assert.equal(parsed.validRows.length, 1, JSON.stringify(parsed.rows[0]?.errors));
    assert.equal(parsed.rows[0].payload.dateOfReporting, "2024-01-25");
  });
  test("error report re-uploaded: helper columns ignored silently, rows parse", () => {
    const src = xlsx([ADD_HEADERS, addRow({ Name: null }), addRow({ "Case ID": "B", Age: "x" })]);
    const first = run(src, F);
    const failed = first.parsed.invalidRows.map((r) => ({ rowNumber: r.rowNumber, raw: r.raw, message: r.errors.map((e) => e.message).join("; ") }));
    const report = toBuffer(buildErrorWorkbook(first.book.headers, failed));
    const { parsed } = run(report, F);
    assert.deepEqual(parsed.unknownHeaders, [], "'Row in your file' / 'Import errors' should not be reported as unknown columns");
    assert.deepEqual(parsed.missingRequired, []);
    assert.equal(parsed.rows.length, 2);
  });
  test("error report round-trip keeps dates correct (5 Feb 2024 stays 5 Feb, not 2 May)", () => {
    // Date cell with built-in format 14 — what Excel in an Indian locale stores for a typed 05/02/2024.
    const src = xlsx([ADD_HEADERS, addRow({ Name: null, "Date of Reporting": dateCell(S_2024_02_05, "m/d/yy") })]);
    const first = run(src, F);
    assert.equal(first.parsed.rows[0].payload.dateOfReporting, "2024-02-05");
    const failed = first.parsed.invalidRows.map((r) => ({ rowNumber: r.rowNumber, raw: r.raw, message: "Name: is required" }));
    const report = buildErrorWorkbook(first.book.headers, failed);
    // user fixes the name in the report and uploads it again
    const ws = report.Sheets[report.SheetNames[0]];
    const hdr = XLSX.utils.sheet_to_json(ws, { header: 1 })[0];
    ws[XLSX.utils.encode_cell({ r: 1, c: hdr.indexOf("Name") })] = { t: "s", v: "Raju" };
    const { parsed } = run(toBuffer(report), F);
    assert.equal(parsed.rows[0].payload.dateOfReporting, "2024-02-05");
  });
  test(".xls (BIFF8) works", () => {
    const { parsed } = run(xlsx([ADD_HEADERS, addRow({ "Date of Reporting": dateCell(S_2024_08_15, "dd/mm/yyyy") })], "Data", "biff8"), F);
    assert.equal(parsed.validRows.length, 1, JSON.stringify(parsed.rows[0]?.errors));
    assert.equal(parsed.rows[0].payload.dateOfReporting, "2024-08-15");
  });
  const csvText = `${ADD_HEADERS.join(",")}\nADD-001,राजू शर्मा,Male,28,मोहन,Ward 4,Howrah,Counselor B,15/08/2024,FW E\n`;
  test(".csv with BOM keeps Devanagari", () => {
    const { parsed } = run(csvBytes(csvText, true), F);
    assert.equal(parsed.rows[0].payload.name, "राजू शर्मा");
  });
  test(".csv WITHOUT BOM (Google Sheets / LibreOffice default) keeps Devanagari", () => {
    const { parsed } = run(csvBytes(csvText, false), F);
    assert.equal(parsed.rows[0].payload.name, "राजू शर्मा");
  });
  test('.csv without BOM: "₹500" still parses as 500', () => {
    const { parsed } = run(csvBytes("X\n₹500\n"), [{ key: "x", label: "X", type: "number" }]);
    assert.equal(parsed.rows[0].payload.x, 500);
  });
  test(".csv: text IDs keep leading zeros and all digits (household code 0012, account no 12345678901234567)", () => {
    const fields = [{ key: "hh", label: "HH" }, { key: "acct", label: "Acct" }];
    const { parsed } = run(csvBytes("HH,Acct\n0012,12345678901234567\n", true), fields);
    assert.equal(parsed.rows[0].payload.hh, "0012");
    assert.equal(parsed.rows[0].payload.acct, "12345678901234567");
  });
  test("CSV via string type", () => {
    const { parsed } = run(csvText, F, {}, { type: "string" });
    assert.equal(parsed.validRows.length, 1, JSON.stringify(parsed.rows[0]?.errors));
  });
});

/* ------------------------------------------------------------------ */
/* ExcelBulkImportButton — static review checks (component can't be rendered here) */
/* ------------------------------------------------------------------ */

describe("ExcelBulkImportButton (static review)", () => {
  const src = readFileSync(path.resolve(here, "../src/components/ExcelBulkImportButton.jsx"), "utf8");
  const api = readFileSync(path.resolve(here, "../src/lib/api.js"), "utf8");
  test("runImport has a synchronous re-entry guard (ref), not only the disabled button", () => {
    const body = src.slice(src.indexOf("const runImport"), src.indexOf("const downloadErrorReport"));
    assert.match(body, /Ref\.current/, "a double-click before React re-renders can start two imports");
  });
  test("worker pool stops on 401 / session expiry instead of firing the rest of the queue", () => {
    const body = src.slice(src.indexOf("const runImport"), src.indexOf("const downloadErrorReport"));
    assert.match(body, /401|abort|stop|cancel/i);
  });
  test("401 toast is suppressed during bulk import (one toast, not one per in-flight row)", () => {
    const start = api.indexOf("status === 401");
    const block = api.slice(start, api.indexOf("return Promise.reject", start));
    assert.match(block, /silentErrorDepth/);
  });
});
