/**
 * Excel import engine — pure functions, no React / XLSX / alias imports.
 *
 * Kept dependency-free on purpose so it can be exercised from Node
 * (see Frontend/scripts/verify-import-templates.mjs), which validates every
 * module template against the real backend Mongoose models.
 *
 * Field definition shape (templates/*.js):
 * {
 *   key: "dateOfReporting",          // payload path, dots create nested objects
 *   label: "Date of Reporting",      // column header in the template
 *   type: "text" | "number" | "integer" | "date" | "boolean" | "enum"
 *       | "multiEnum" | "phone" | "email" | "ward",
 *   required: true,                  // row is rejected when blank
 *   options: ["A", "B"],             // enum / multiEnum allowed values (canonical spelling)
 *   aliases: { "B": ["bee"] },       // optional extra spellings that map to an option
 *   headerAliases: ["Reporting Date"],// optional extra column headers accepted for this field
 *   min, max,                        // number / integer bounds
 *   wardFormat: "prefixed" | "plain",// ward: "Ward 4" (default) or "4"
 *   hint: "Free text shown in Instructions sheet",
 * }
 *
 * Cells handed to parseRow are { v, t, w } as produced by readWorkbookRows():
 *   v = raw value, t = SheetJS type ("s","n","b","d","e","z"), w = formatted text,
 *   isDate = true when the cell carries a date number format.
 */

export const FIELD_TYPES = [
  "text",
  "number",
  "integer",
  "date",
  "boolean",
  "enum",
  "multiEnum",
  "phone",
  "email",
  "ward",
];

const MONTHS = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
  september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

/** Header normalisation: trims, collapses whitespace, drops a trailing "*" (required marker). */
export const normalizeHeader = (value) =>
  String(value ?? "")
    .replace(/ /g, " ")
    .trim()
    .replace(/\s*\*+\s*$/, "")
    .replace(/\s+/g, " ");

/** Loose comparison key: case/punctuation/space-insensitive. */
export const comparable = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const compactKey = (value) => comparable(value).replace(/\s+/g, "");

const pad2 = (n) => String(n).padStart(2, "0");

const isValidYMD = (y, m, d) => {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1) return false;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d <= daysInMonth;
};

const toYMD = (y, m, d) => (isValidYMD(y, m, d) ? `${y}-${pad2(m)}-${pad2(d)}` : null);

const expandYear = (y) => {
  if (y >= 100) return y;
  // Two-digit years: 00-29 → 2000s, 30-99 → 1900s (Excel's own pivot)
  return y < 30 ? 2000 + y : 1900 + y;
};

/* ------------------------------------------------------------------ */
/* Field normalisation                                                 */
/* ------------------------------------------------------------------ */

export const normalizeFieldDefinition = (field) => {
  if (typeof field === "string") {
    return { key: field, label: field, type: "text", required: false, options: [] };
  }
  const options = Array.isArray(field?.options)
    ? field.options.map((o) => (typeof o === "object" && o !== null ? o.value : o)).filter((o) => o !== undefined && o !== null && o !== "")
    : [];
  let type = field?.type;
  if (!type) type = options.length ? "enum" : "text";
  return {
    ...field,
    key: field?.key || field?.label || "",
    label: field?.label || field?.key || "",
    type,
    required: Boolean(field?.required),
    options,
  };
};

export const normalizeFields = (fields = []) => fields.map(normalizeFieldDefinition).filter((f) => f.key);

/** Map of comparable header → field. Accepts label, key, and headerAliases. */
export const buildHeaderLookup = (fields) => {
  const map = new Map();
  fields.forEach((field) => {
    [field.label, field.key, ...(field.headerAliases || [])].forEach((candidate) => {
      const k = compactKey(normalizeHeader(candidate));
      if (k && !map.has(k)) map.set(k, field);
    });
  });
  return map;
};

/**
 * Resolve the sheet's header row against the template.
 * Returns { columns: [{ header, field|null }], unknownHeaders, missingRequired, duplicateHeaders }
 */
/** Columns added by buildErrorWorkbook — ignored on re-upload. */
export const REPORT_HELPER_HEADERS = ["Row in your file", "Import errors"];
const isHelperHeader = (h) => REPORT_HELPER_HEADERS.some((x) => compactKey(x) === compactKey(normalizeHeader(h)));

/** How many cells of a candidate header row match template fields. */
export const countHeaderMatches = (headers, fields) => {
  const lookup = buildHeaderLookup(normalizeFields(fields));
  return headers.filter((h) => lookup.has(compactKey(normalizeHeader(h)))).length;
};

export const resolveHeaders = (headers, fields) => {
  const lookup = buildHeaderLookup(fields);
  const seen = new Map();
  const columns = headers.map((header) => {
    const field = lookup.get(compactKey(normalizeHeader(header))) || null;
    if (field) seen.set(field.key, (seen.get(field.key) || 0) + 1);
    return { header, field };
  });
  const unknownHeaders = columns
    .filter((c) => !c.field && normalizeHeader(c.header) && !/^__EMPTY/.test(String(c.header)) && !isHelperHeader(c.header))
    .map((c) => normalizeHeader(c.header));
  const duplicateHeaders = fields.filter((f) => (seen.get(f.key) || 0) > 1).map((f) => f.label);
  const missingRequired = fields.filter((f) => f.required && !seen.has(f.key)).map((f) => f.label);
  const missingOptional = fields.filter((f) => !f.required && !seen.has(f.key)).map((f) => f.label);
  return { columns, unknownHeaders, missingRequired, missingOptional, duplicateHeaders };
};

/* ------------------------------------------------------------------ */
/* Value coercion                                                      */
/* ------------------------------------------------------------------ */

/** Excel serial date → "YYYY-MM-DD" (timezone-safe, ignores time part). */
export const excelSerialToYMD = (serial) => {
  if (typeof serial !== "number" || !Number.isFinite(serial)) return null;
  let days = Math.floor(serial);
  if (days <= 0 || days === 60) return null;
  // Excel wrongly treats 1900 as a leap year (serial 60 = 29 Feb 1900).
  if (days < 61) days += 1;
  const ms = Date.UTC(1899, 11, 30) + days * 86400000;
  const d = new Date(ms);
  return toYMD(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
};

/**
 * Parse a date string. Day-first (Indian convention) for numeric formats:
 * 15/08/2024, 15-08-2024, 15.08.24, 2024-08-15, 15 Aug 2024, Aug 15 2024, 2024-08-15T00:00:00Z.
 */
export const parseDateString = (input) => {
  const s = String(input ?? "").trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/);
  if (m) return toYMD(+m[1], +m[2], +m[3]);

  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})(?:\s.*)?$/);
  if (m) {
    const a = +m[1];
    const b = +m[2];
    const y = expandYear(+m[3]);
    // Day-first; only fall back to month-first when day-first is impossible (e.g. 08/15/2024).
    return toYMD(y, b, a) || (a <= 12 && b > 12 ? toYMD(y, a, b) : null);
  }

  m = s.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s\-/.,]+([a-z]+)[\s\-/.,]+(\d{2}|\d{4})$/i);
  if (m && MONTHS[m[2].toLowerCase()]) return toYMD(expandYear(+m[3]), MONTHS[m[2].toLowerCase()], +m[1]);

  m = s.match(/^([a-z]+)[\s\-/.,]+(\d{1,2})(?:st|nd|rd|th)?[\s\-/.,]+(\d{2}|\d{4})$/i);
  if (m && MONTHS[m[1].toLowerCase()]) return toYMD(expandYear(+m[3]), MONTHS[m[1].toLowerCase()], +m[2]);

  if (/^\d+(\.\d+)?$/.test(s)) return excelSerialToYMD(Number(s));

  return null;
};

const TRUE_WORDS = new Set(["true", "yes", "y", "1", "t", "haan", "ha", "done", "completed"]);
const FALSE_WORDS = new Set(["false", "no", "n", "0", "f", "nahi", "not done"]);

/** Raw display text of a cell, independent of target type. */
export const cellText = (cell) => {
  if (cell === null || cell === undefined) return "";
  if (typeof cell !== "object" || cell instanceof Date) {
    return cell instanceof Date ? cell.toISOString() : String(cell).trim();
  }
  const { v, t, w } = cell;
  if (v === null || v === undefined || t === "z") return "";
  if (t === "e") return "";
  if (t === "n") {
    if (cell.isDate && w) return String(w).trim();
    // Avoid "9.87654321E+09" and float noise like 4.000000001
    if (Number.isInteger(v)) return String(v);
    return String(Number(v.toPrecision(12)));
  }
  if (t === "b") return v ? "TRUE" : "FALSE";
  if (v instanceof Date) return v.toISOString();
  return String(v).replace(/ /g, " ").trim();
};

/** "#N/A", "#REF!"… when the cell holds a formula error, else null. */
export const cellError = (cell) => {
  if (!cell || typeof cell !== "object" || cell.t !== "e") return null;
  const codes = { 0: "#NULL!", 7: "#DIV/0!", 15: "#VALUE!", 23: "#REF!", 29: "#NAME?", 36: "#NUM!", 42: "#N/A", 43: "#GETTING_DATA" };
  return cell.w || codes[cell.v] || "#ERROR";
};

/** Text for previews / error reports: like cellText, but date cells as DD/MM/YYYY (never US m/d/yy). */
export const cellDisplay = (cell) => {
  const formulaError = cellError(cell);
  if (formulaError) return formulaError;
  if (cell && typeof cell === "object" && cell.t === "n" && cell.isDate) {
    const ymd = excelSerialToYMD(cell.v);
    if (ymd) return `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}/${ymd.slice(0, 4)}`;
  }
  return cellText(cell);
};

const PLACEHOLDER = /^(n\/?a|-+|—|nil|null|none)$/i;

/**
 * Coerce one cell for a field.
 * Returns { value, error?, warning?, empty: boolean }
 */
export const coerceCell = (cell, field) => {
  const formulaError = cellError(cell);
  if (formulaError) return { value: undefined, empty: false, error: `formula error (${formulaError}) in this cell` };
  const text = cellText(cell);
  const isObj = cell && typeof cell === "object" && !(cell instanceof Date);
  if (text === "") return { value: undefined, empty: true };
  if (PLACEHOLDER.test(text)) {
    // Optional text keeps "None" etc. as a real answer; everywhere else a placeholder means blank.
    const isText = field.type === "text" || !field.type;
    const isOption = (field.type === "enum" || field.type === "multiEnum") && matchOption(text, field) !== null;
    if ((!isText || field.required) && !isOption) return { value: undefined, empty: true };
  }

  switch (field.type) {
    case "number":
    case "integer": {
      let num;
      if (isObj && cell.t === "n" && !cell.isDate) num = cell.v;
      else {
        const cleaned = text.replace(/,/g, "").replace(/^(₹|rs\.?|inr)\s*/i, "").trim();
        num = /^[-+]?(\d+\.?\d*|\.\d+)$/.test(cleaned) ? Number(cleaned) : NaN;
      }
      if (!Number.isFinite(num)) return { value: undefined, empty: false, error: `"${text}" is not a number` };
      num = Number(num.toPrecision(12)); // drop float noise like 28.000000000000004
      if (field.type === "integer" && !Number.isInteger(num)) {
        return { value: undefined, empty: false, error: `"${text}" must be a whole number` };
      }
      if (field.min !== undefined && num < field.min) return { value: undefined, empty: false, error: `must be at least ${field.min}` };
      if (field.max !== undefined && num > field.max) return { value: undefined, empty: false, error: `must be at most ${field.max}` };
      return { value: num, empty: false };
    }

    case "date": {
      let ymd = null;
      if (isObj && cell.t === "n") {
        // A plain (not date-formatted) number below ~1910 is a typed year like 2024, not a date serial.
        if (!cell.isDate && cell.v < 3653) return { value: undefined, empty: false, error: `"${text}" is not a full date (use DD/MM/YYYY)` };
        ymd = excelSerialToYMD(cell.v);
      }
      else if (isObj && cell.t === "d" && cell.v instanceof Date) ymd = toYMD(cell.v.getFullYear(), cell.v.getMonth() + 1, cell.v.getDate());
      else ymd = parseDateString(text);
      if (!ymd) return { value: undefined, empty: false, error: `"${text}" is not a valid date (use DD/MM/YYYY)` };
      return { value: ymd, empty: false };
    }

    case "boolean": {
      if (isObj && cell.t === "b") return { value: Boolean(cell.v), empty: false };
      const k = comparable(text);
      if (TRUE_WORDS.has(k)) return { value: true, empty: false };
      if (FALSE_WORDS.has(k)) return { value: false, empty: false };
      return { value: undefined, empty: false, error: `"${text}" should be Yes or No` };
    }

    case "enum": {
      const match = matchOption(text, field);
      if (match === null) {
        return { value: undefined, empty: false, error: `"${text}" is not an allowed value (${field.options.join(", ")})` };
      }
      return { value: match, empty: false };
    }

    case "multiEnum": {
      const whole = matchOption(text, field);
      const parts = whole !== null ? [text] : text.split(/\s*[,;|\n/]\s*/).map((p) => p.trim()).filter(Boolean);
      const values = [];
      const bad = [];
      parts.forEach((p) => {
        const match = matchOption(p, field);
        if (match === null) bad.push(p);
        else if (!values.includes(match)) values.push(match);
      });
      if (bad.length) {
        return { value: undefined, empty: false, error: `"${bad.join(", ")}" not allowed (${field.options.join(", ")})` };
      }
      return { value: values, empty: values.length === 0 };
    }

    case "phone": {
      // Landline with STD code (080-2345 6789, 079 2345 6789): reject instead of stripping into a fake mobile.
      if (/^0\d{2,4}[\s-]/.test(text) && !/^0091|^091[\s-]/.test(text) && !/^0[6-9]\d{4}[\s-]?\d{5}$/.test(text)) {
        return { value: undefined, empty: false, error: `"${text}" looks like a landline; a 10-digit mobile number is needed` };
      }
      let digits = text.replace(/[^\d+]/g, "");
      if (digits.startsWith("+91")) digits = digits.slice(3);
      else if (digits.startsWith("0091")) digits = digits.slice(4);
      else if (digits.length === 13 && digits.startsWith("091")) digits = digits.slice(3);
      else if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
      else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
      digits = digits.replace(/\D/g, "");
      if (!/^[6-9]\d{9}$/.test(digits)) {
        return { value: undefined, empty: false, error: `"${text}" is not a valid 10-digit mobile number` };
      }
      return { value: digits, empty: false };
    }

    case "email": {
      const email = text.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { value: undefined, empty: false, error: `"${text}" is not a valid email` };
      return { value: email, empty: false };
    }

    case "ward": {
      const m = text.match(/^(?:ward\s*(?:no\.?|number)?\s*[-:#]?\s*|w\s*[-:#]?\s*)?(\d{1,4})$/i);
      if (!m) {
        if (field.allowFreeText) return { value: text, empty: false };
        return { value: undefined, empty: false, error: `"${text}" is not a ward number` };
      }
      const n = Number(m[1]);
      if (field.max !== undefined && n > field.max) return { value: undefined, empty: false, error: `ward must be between 1 and ${field.max}` };
      if (n < 1) return { value: undefined, empty: false, error: `ward must be 1 or more` };
      return { value: field.wardFormat === "plain" ? String(n) : `Ward ${n}`, empty: false };
    }

    case "text":
    default:
      return { value: text, empty: false };
  }
};

/** Find the canonical option for a typed value, honouring field.aliases. */
export const matchOption = (text, field) => {
  const key = comparable(text);
  if (!key) return null;
  const direct = field.options.find((o) => comparable(o) === key);
  if (direct !== undefined) return direct;
  const compact = key.replace(/\s+/g, "");
  const compactHit = field.options.find((o) => comparable(o).replace(/\s+/g, "") === compact);
  if (compactHit !== undefined) return compactHit;
  const singular = (v) => v.replace(/s$/, "");
  const pluralHits = field.options.filter((o) => singular(comparable(o).replace(/\s+/g, "")) === singular(compact));
  if (pluralHits.length === 1) return pluralHits[0];
  if (field.aliases) {
    for (const [option, list] of Object.entries(field.aliases)) {
      if ((list || []).some((a) => comparable(a) === key)) return option;
    }
  }
  return null;
};

/* ------------------------------------------------------------------ */
/* Row parsing                                                         */
/* ------------------------------------------------------------------ */

export const setPath = (target, path, value) => {
  const segments = String(path).split(".").filter(Boolean);
  let node = target;
  segments.forEach((segment, i) => {
    if (i === segments.length - 1) {
      node[segment] = value;
      return;
    }
    if (!node[segment] || typeof node[segment] !== "object" || Array.isArray(node[segment])) node[segment] = {};
    node = node[segment];
  });
};

/**
 * Parse a single row.
 * @param cells   array aligned with `columns`
 * @param columns output of resolveHeaders().columns
 * @param fields  normalised fields (for required checks)
 * @returns { payload, errors: [{field,label,message}], isBlank }
 */
export const parseRow = (cells, columns, fields) => {
  const payload = {};
  const errors = [];
  const filled = new Set();
  let anyValue = false;

  columns.forEach((col, i) => {
    const cell = cells[i];
    if (cellText(cell) !== "" || cellError(cell)) anyValue = true;
    if (!col.field) return;
    const { value, error, empty } = coerceCell(cell, col.field);
    if (error) {
      errors.push({ field: col.field.key, label: col.field.label, message: error });
      return;
    }
    if (empty || value === undefined) return;
    if (filled.has(col.field.key)) return; // first matching column wins
    filled.add(col.field.key);
    setPath(payload, col.field.key, value);
  });

  if (!anyValue) return { payload, errors: [], isBlank: true };

  fields.forEach((field) => {
    if (field.required && !filled.has(field.key) && !errors.some((e) => e.field === field.key)) {
      errors.push({ field: field.key, label: field.label, message: "is required" });
    }
  });

  return { payload, errors, isBlank: false };
};

/**
 * Parse a whole sheet.
 * @param headers  header row (array of strings)
 * @param rows     array of { rowNumber, cells }
 * @param rawFields template fields
 * @param options  { uniqueKeys?: string[], transform?: (payload) => payload }
 */
export const parseSheet = (headers, rows, rawFields, options = {}) => {
  const fields = normalizeFields(rawFields);
  const headerInfo = resolveHeaders(headers, fields);
  const uniqueKeys = options.uniqueKeys || fields.filter((f) => f.unique).map((f) => f.key);
  const seenUnique = new Map(uniqueKeys.map((k) => [k, new Map()]));

  const parsed = [];
  rows.forEach(({ rowNumber, cells }) => {
    const result = parseRow(cells, headerInfo.columns, fields);
    if (result.isBlank) return;

    uniqueKeys.forEach((key) => {
      const v = key.split(".").reduce((o, k) => (o == null ? o : o[k]), result.payload);
      if (v === undefined || v === null || v === "") return;
      const norm = comparable(v);
      const seen = seenUnique.get(key);
      if (seen.has(norm)) {
        const field = fields.find((f) => f.key === key);
        result.errors.push({
          field: key,
          label: field?.label || key,
          message: `duplicates row ${seen.get(norm)} in this file`,
        });
      } else {
        seen.set(norm, rowNumber);
      }
    });

    let payload = result.payload;
    if (typeof options.transform === "function" && result.errors.length === 0) {
      try {
        payload = options.transform(payload) || payload;
      } catch (e) {
        result.errors.push({ field: "", label: "Row", message: e?.message || "could not be prepared" });
      }
    }

    parsed.push({
      rowNumber,
      payload,
      errors: result.errors,
      // Aligned with `headers` by index (duplicate header names stay distinct); dates as DD/MM/YYYY.
      raw: headers.map((_, i) => cellDisplay(cells[i])),
    });
  });

  return {
    fields,
    ...headerInfo,
    rows: parsed,
    validRows: parsed.filter((r) => r.errors.length === 0),
    invalidRows: parsed.filter((r) => r.errors.length > 0),
  };
};

/* ------------------------------------------------------------------ */
/* Template helpers                                                    */
/* ------------------------------------------------------------------ */

export const describeFormat = (field) => {
  switch (field.type) {
    case "date": return "Date — DD/MM/YYYY (e.g. 15/08/2024)";
    case "number": return [ "Number", field.min !== undefined ? `min ${field.min}` : null, field.max !== undefined ? `max ${field.max}` : null ].filter(Boolean).join(", ");
    case "integer": return [ "Whole number", field.min !== undefined ? `min ${field.min}` : null, field.max !== undefined ? `max ${field.max}` : null ].filter(Boolean).join(", ");
    case "boolean": return "Yes / No";
    case "enum": return "Pick one of the allowed values";
    case "multiEnum": return "One or more allowed values, separated by commas";
    case "phone": return "10-digit mobile number (starts with 6-9); +91 / leading 0 is removed";
    case "email": return "Email address";
    case "ward": return field.wardFormat === "plain" ? "Ward number, e.g. 12" : "Ward number, e.g. 12 or Ward 12";
    default: return "Text";
  }
};

/** Rows for the Instructions sheet. */
export const buildInstructionRows = (rawFields) => {
  const fields = normalizeFields(rawFields);
  return [
    ["Column", "Required", "Format", "Allowed values", "Notes"],
    ...fields.map((f) => [
      f.required ? `${f.label} *` : f.label,
      f.required ? "Yes" : "No",
      describeFormat(f),
      f.options.length ? f.options.join(", ") : "",
      f.hint || "",
    ]),
  ];
};

/** Header labels for the template; required columns are marked with " *". */
export const buildTemplateHeaders = (rawFields) =>
  normalizeFields(rawFields).map((f) => (f.required ? `${f.label} *` : f.label));

/** Convert a sample payload value into a display value for the template's example row. */
export const sampleCellValue = (field, value) => {
  if (value === undefined || value === null) return "";
  if (field.type === "date" && typeof value === "string") {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  if (field.type === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return value;
};

export const getPath = (obj, path) =>
  String(path).split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
