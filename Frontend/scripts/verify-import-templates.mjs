#!/usr/bin/env node
/**
 * Verifies every Excel import template against the backend Mongoose model it feeds.
 *
 *   node scripts/verify-import-templates.mjs            # all templates
 *   node scripts/verify-import-templates.mjs addiction  # one template (by file name)
 *
 * For each template it:
 *   1. builds the downloadable template workbook with the sample row, writes it to a buffer,
 *      reads it back and parses it exactly like the browser does;
 *   2. validates the resulting payload with the real Mongoose model (doc.validate(), which runs
 *      pre("validate") hooks; pre("save") hooks are NOT run — check those by hand);
 *   3. cross-checks template fields vs. the schema: unknown keys, required mismatches,
 *      enum drift, type mismatches, and schema fields the template doesn't cover.
 *
 * Exit code 1 if any ERROR is found. WARN lines are informational.
 * No database connection is needed.
 */
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as XLSX from "xlsx";

import { normalizeFields, parseSheet } from "../src/lib/excelImport/core.js";
import { buildTemplateWorkbook, readWorkbookRows } from "../src/lib/excelImport/workbook.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.resolve(here, "../src/lib/excelImport/templates");
const backendModules = path.resolve(here, "../../sevaKendra-backend/src/modules");

const only = process.argv[2];
const SYSTEM_PATHS = new Set(["_id", "__v", "createdAt", "updatedAt", "createdBy", "updatedBy", "isActive", "isDeleted"]);

const TYPE_COMPAT = {
  String: ["text", "enum", "phone", "email", "ward", "date"],
  Number: ["number", "integer"],
  Date: ["date"],
  Boolean: ["boolean"],
  Array: ["multiEnum", "text"],
  ObjectId: [],
  Mixed: ["text", "number", "integer", "date", "boolean", "enum"],
};

let errorCount = 0;
let warnCount = 0;
const err = (name, msg) => {
  errorCount += 1;
  console.log(`  ERROR ${msg}`);
};
const warn = (name, msg) => {
  warnCount += 1;
  console.log(`  WARN  ${msg}`);
};

const files = readdirSync(templatesDir)
  .filter((f) => f.endsWith(".js") && f !== "index.js")
  .filter((f) => !only || f.replace(/\.js$/, "") === only);

if (!files.length) {
  console.log(only ? `No template named ${only}` : "No templates found");
  process.exit(1);
}

const mongoose = (await import(pathToFileURL(path.resolve(here, "../../sevaKendra-backend/node_modules/mongoose/index.js")).href)).default;

for (const file of files) {
  const name = file.replace(/\.js$/, "");
  const template = (await import(pathToFileURL(path.join(templatesDir, file)).href)).default;
  console.log(`\n■ ${name} — ${template.title} (${template.model})`);

  if (!template.model) {
    err(name, "template.model is missing (path under sevaKendra-backend/src/modules)");
    continue;
  }
  const Model = (await import(pathToFileURL(path.join(backendModules, template.model)).href)).default;
  const schema = Model.schema;
  const fields = normalizeFields(template.fields);

  // ---- 1. schema cross-check -------------------------------------------------
  const keys = new Set();
  for (const f of fields) {
    if (keys.has(f.key)) err(name, `duplicate field key "${f.key}"`);
    keys.add(f.key);
    const p = schema.path(f.key);
    if (!p) {
      err(name, `field "${f.key}" (${f.label}) is not in the schema`);
      continue;
    }
    const instance = p.instance;
    const ok = (TYPE_COMPAT[instance] || []).includes(f.type);
    if (!ok) err(name, `field "${f.key}" type "${f.type}" doesn't fit schema type ${instance}`);

    const schemaRequired = Boolean(p.isRequired) && typeof p.originalRequiredValue !== "function";
    const conditional = typeof p.originalRequiredValue === "function";
    const hasDefault = p.defaultValue !== undefined;
    if (schemaRequired && !f.required && !hasDefault) err(name, `"${f.key}" is required in the schema but not marked required in the template`);
    if (conditional && !f.hint) warn(name, `"${f.key}" is conditionally required in the schema — explain it in hint`);

    const enumValues = p.enumValues?.length ? p.enumValues : p.caster?.enumValues || [];
    const wardEnum = f.type === "ward" && enumValues.length && enumValues.every((v) => /^Ward \d+$/.test(v));
    if (wardEnum) {
      const maxWard = Math.max(...enumValues.map((v) => Number(v.slice(5))));
      if (f.wardFormat === "plain") err(name, `"${f.key}" schema enum is "Ward N" but wardFormat is plain`);
      if (f.max === undefined || f.max > maxWard) warn(name, `"${f.key}" ward enum stops at ${maxWard}; set max: ${maxWard}`);
    } else if (enumValues.length) {
      if (!["enum", "multiEnum"].includes(f.type)) err(name, `"${f.key}" has a schema enum but template type is "${f.type}"`);
      const extra = f.options.filter((o) => !enumValues.includes(o));
      const missing = enumValues.filter((o) => !f.options.includes(o) && o !== "" && o !== null);
      if (extra.length) err(name, `"${f.key}" options not allowed by schema: ${extra.join(" | ")}`);
      if (missing.length) warn(name, `"${f.key}" schema allows values the template doesn't offer: ${missing.join(" | ")}`);
    } else if (f.type === "enum" && !f.options.length) {
      err(name, `"${f.key}" is enum but has no options`);
    }
  }

  // Schema fields that are required but absent from the template entirely
  schema.eachPath((p, type) => {
    if (SYSTEM_PATHS.has(p) || p.split(".").some((s) => SYSTEM_PATHS.has(s))) return;
    if (keys.has(p) || template.resolvedRefs?.includes(p)) return;
    const req = Boolean(type.isRequired) && typeof type.originalRequiredValue !== "function";
    const hasDefault = type.defaultValue !== undefined;
    if (req && !hasDefault) err(name, `schema requires "${p}" but the template has no column for it`);
  });

  // Coverage report (informational)
  const uncovered = [];
  schema.eachPath((p, type) => {
    if (SYSTEM_PATHS.has(p) || keys.has(p) || template.resolvedRefs?.includes(p)) return;
    if (["ObjectId", "Embedded"].includes(type.instance)) return;
    if (template.excluded?.includes(p) || template.excluded?.some((e) => p.startsWith(`${e}.`))) return;
    uncovered.push(p);
  });
  if (uncovered.length) warn(name, `schema fields not in template (add them or list in template.excluded): ${uncovered.join(", ")}`);

  // ---- 2. round-trip the sample row through the real parser --------------------
  if (!template.sampleRow) {
    err(name, "template.sampleRow is missing");
    continue;
  }
  const book = buildTemplateWorkbook(template.fields, template.sampleRow);
  const buffer = XLSX.write(book, { type: "array", bookType: "xlsx" });
  const back = XLSX.read(buffer, { type: "array" });
  // Copy the Sample Data sheet into a fresh workbook so the reader picks it up as data
  const sampleBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(sampleBook, back.Sheets["Sample Data"], "Data");
  const sampleBuffer = XLSX.write(sampleBook, { type: "array", bookType: "xlsx" });
  const sheet = readWorkbookRows(sampleBuffer);
  const parsed = parseSheet(sheet.headers, sheet.rows, template.fields, {
    uniqueKeys: template.uniqueKeys,
    transform: template.transform,
  });

  if (parsed.missingRequired.length) err(name, `template headers don't resolve: ${parsed.missingRequired.join(", ")}`);
  if (parsed.unknownHeaders.length) err(name, `template headers don't map back: ${parsed.unknownHeaders.join(", ")}`);
  if (parsed.rows.length !== 1) {
    err(name, `expected 1 sample row, parsed ${parsed.rows.length}`);
    continue;
  }
  const [row] = parsed.rows;
  row.errors.forEach((e) => err(name, `sample row: ${e.label} ${e.message}`));
  const missingSample = fields.filter((f) => f.required && row.payload && getPath(row.payload, f.key) === undefined);
  if (missingSample.length) err(name, `sampleRow lacks required: ${missingSample.map((f) => f.key).join(", ")}`);

  // ---- 3. validate with Mongoose ----------------------------------------------
  // resolvedRefs: ObjectId refs the page resolves before POSTing — stand in a fake id.
  const refStubs = Object.fromEntries(
    (template.resolvedRefs || []).map((rp) => [rp, schema.path(rp)?.instance === "Array" ? [new mongoose.Types.ObjectId()] : new mongoose.Types.ObjectId()])
  );
  const doc = new Model({ ...row.payload, ...refStubs, createdBy: new mongoose.Types.ObjectId(), updatedBy: new mongoose.Types.ObjectId() });
  try {
    await doc.validate();
    console.log(`  OK    sample row validates against the model (${Object.keys(row.payload).length} top-level fields)`);
  } catch (e) {
    if (e?.errors) {
      Object.values(e.errors).forEach((v) => err(name, `mongoose: ${v.path}: ${v.message}`));
    } else {
      err(name, `mongoose: ${e?.message || e}`);
    }
  }

  // Values must survive casting unchanged (catches "Ward 4" → number etc.)
  for (const f of fields) {
    const sent = getPath(row.payload, f.key);
    if (sent === undefined) continue;
    const stored = doc.get(f.key);
    const norm = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : Array.isArray(v) ? JSON.stringify([...v]) : String(v));
    if (norm(stored) !== norm(sent)) warn(name, `"${f.key}" changed on cast: sent ${JSON.stringify(sent)} stored ${JSON.stringify(norm(stored))}`);
  }
}

function getPath(obj, p) {
  return String(p).split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

console.log(`\n${errorCount} error(s), ${warnCount} warning(s) across ${files.length} template(s).`);
process.exit(errorCount ? 1 : 0);
