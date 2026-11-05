#!/usr/bin/env node
/**
 * Flags hard-coded <SelectItem value="…"> options on module pages that no enum in the
 * page's backend model accepts (a form/filter offering a value the API will reject).
 *
 *   node scripts/check-form-options.mjs
 *
 * Heuristic: compares literal option values only (options rendered from template constants
 * are already exact). Ignores "all"/"none" filter sentinels and ward options.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pagesDir = path.resolve(here, "../src/pages");
const modulesDir = path.resolve(here, "../../sevaKendra-backend/src/modules");
const templatesDir = path.resolve(here, "../src/lib/excelImport/templates");

// page → template (which names the model)
const PAGES = {
  Addiction: "addiction", Adolescents: "adolescents", BoardPreparation: "boardPreparation",
  CBUCBODetails: "cbucboDetails", CompetitiveExams: "competitiveExam", Dropouts: "dropout",
  Elderly: "elderly", Entitlements: "entitlements", GroupLeaders: "groupLeader", HIV: "hiv",
  HealthCamps: "healthCamp", LegalAid: "legalAidService", Leprosy: "leprosy",
  MotherChild: "motherChild", OtherDiseases: "otherDiseases", PWD: "pwd", SCStudents: "scStudent",
  Schools: "school", StudyCenters: "studyCenter", Teachers: "teacher", Tuberculosis: "tuberculosis",
  Workshops: "workshopsAwareness",
};
const IGNORE = /^(all|none|any|)$/i;

let problems = 0;
for (const [page, tpl] of Object.entries(PAGES)) {
  const template = (await import(pathToFileURL(path.join(templatesDir, `${tpl}.js`)).href)).default;
  const Model = (await import(pathToFileURL(path.join(modulesDir, template.model)).href)).default;
  const allowed = new Set();
  Model.schema.eachPath((_, t) => {
    (t.enumValues || []).forEach((v) => allowed.add(v));
    (t.caster?.enumValues || []).forEach((v) => allowed.add(v));
  });
  // Nested single-nested schemas
  Object.values(Model.schema.childSchemas || []).forEach(({ schema }) =>
    schema.eachPath((_, t) => (t.enumValues || []).forEach((v) => allowed.add(v)))
  );

  const src = readFileSync(path.join(pagesDir, `${page}.jsx`), "utf8")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "") // JSX comments (commented-out filters)
    .replace(/\/\*[\s\S]*?\*\//g, "");
  const values = [...src.matchAll(/<SelectItem(?![^>]*\bdisabled\b)[^>]*\bvalue="([^"]*)"/g)].map((m) => m[1]);
  const bad = [...new Set(values)].filter((v) => !IGNORE.test(v) && !/^Ward \d+$/.test(v) && !allowed.has(v));
  if (bad.length) {
    problems += bad.length;
    console.log(`${page}: ${bad.map((v) => JSON.stringify(v)).join(", ")}`);
  }
}
console.log(problems ? `\n${problems} option value(s) not accepted by the model.` : "All literal Select options are valid model values.");
process.exit(problems ? 1 : 0);
