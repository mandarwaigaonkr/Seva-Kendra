/**
 * SheetJS adapters for the import engine. Works in the browser and in Node.
 * Kept separate from core.js so core stays dependency-free.
 */
import * as XLSX from "xlsx";

import {
  buildInstructionRows,
  buildTemplateHeaders,
  cellText,
  countHeaderMatches,
  getPath,
  normalizeFields,
  normalizeHeader,
  sampleCellValue,
} from "./core.js";

/**
 * Does an Excel number format describe a date/time? (The ESM build of SheetJS
 * doesn't export SSF.is_date, so this mirrors its logic.)
 */
export const isDateFormat = (fmt) => {
  if (fmt === undefined || fmt === null) return false;
  if (typeof fmt === "number") {
    // Built-in date formats: 14-22, 45-47; locale variants 27-36, 50-58
    return (fmt >= 14 && fmt <= 22) || (fmt >= 27 && fmt <= 36) || (fmt >= 45 && fmt <= 47) || (fmt >= 50 && fmt <= 58);
  }
  const stripped = String(fmt)
    .replace(/"[^"]*"/g, "") // quoted literals
    .replace(/\\./g, "") // escaped chars
    .replace(/\[(?:\$[^\]]*|[a-z]+(?:\d+)?)\]/gi, "") // [$-409], [Red], [Color10]
    .replace(/_.|\*./g, ""); // padding
  if (/^general$/i.test(stripped.trim())) return false;
  if (/[0#?][.,]?[0#?]*e[+-]/i.test(stripped)) return false; // scientific
  return /[dmyhs]/i.test(stripped) || /\[(h+|m+|s+)\]/i.test(String(fmt));
};

const NON_DATA_SHEETS = /^(instructions?|sample ?data|example|readme|help)$/i;
const PREFERRED_SHEETS = /^(data|import ?template|records?)$/i;

const pickSheet = (workbook) => {
  const names = workbook.SheetNames || [];
  return (
    names.find((n) => PREFERRED_SHEETS.test(n.trim())) ||
    names.find((n) => !NON_DATA_SHEETS.test(n.trim())) ||
    names[0]
  );
};

const toBytes = (data) => {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return null;
};

/** xlsx/xlsm/ods are zip ("PK"), .xls is OLE (D0 CF 11 E0). Anything else we treat as delimited text. */
const isBinarySpreadsheet = (bytes) =>
  (bytes[0] === 0x50 && bytes[1] === 0x4b) || (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0);

/**
 * Parse the file. CSV/TSV is decoded as UTF-8 ourselves (Google Sheets/LibreOffice omit the BOM) and read
 * with raw:true so SheetJS doesn't guess US dates, drop leading zeros or round long IDs — the engine parses text.
 */
const readBook = (data, type) => {
  const opts = { cellDates: false, cellNF: true, cellText: true, dense: false };
  if (type === "string") return XLSX.read(String(data).replace(/^﻿/, ""), { ...opts, type: "string", raw: true });
  const bytes = toBytes(data);
  if (bytes && bytes.length && !isBinarySpreadsheet(bytes)) {
    const text = new TextDecoder("utf-8").decode(bytes).replace(/^﻿/, "");
    return XLSX.read(text, { ...opts, type: "string", raw: true });
  }
  return XLSX.read(data, { ...opts, type });
};

/** Real extent of a sheet from its cell keys (the stored !ref can be A1:Z1048576 when whole columns are formatted). */
const usedRange = (sheet) => {
  const declared = XLSX.utils.decode_range(sheet["!ref"]);
  let maxR = -1;
  let maxC = -1;
  let minR = Infinity;
  let minC = Infinity;
  for (const key of Object.keys(sheet)) {
    if (key[0] === "!") continue;
    const cell = sheet[key];
    if (!cell || (cell.v === undefined && cell.t !== "e") || cell.t === "z") continue;
    const { r, c } = XLSX.utils.decode_cell(key);
    if (r > maxR) maxR = r;
    if (c > maxC) maxC = c;
    if (r < minR) minR = r;
    if (c < minC) minC = c;
  }
  if (maxR < 0) return null;
  return { s: { r: Math.max(declared.s.r, Math.min(minR, declared.s.r)), c: Math.min(minC, declared.s.c) }, e: { r: maxR, c: maxC } };
};

const HEADER_SCAN_ROWS = 10;

/**
 * Read a workbook buffer into { sheetName, headers, rows: [{ rowNumber, cells }] }.
 * Header row: when `fields` is given, the row (among the first non-empty rows) that matches the most template
 * columns — so a title row above the headers doesn't break the import. Otherwise the first non-empty row.
 * rowNumber is the real spreadsheet row number (1-based) so errors point at the right line.
 */
export const readWorkbookRows = (data, { type = "array", fields } = {}) => {
  const workbook = readBook(data, type);
  const sheetName = pickSheet(workbook);
  if (!sheetName) return { sheetName: null, headers: [], rows: [] };

  const sheet = workbook.Sheets[sheetName];
  if (!sheet || !sheet["!ref"]) return { sheetName, headers: [], rows: [] };

  const range = usedRange(sheet);
  if (!range) return { sheetName, headers: [], rows: [] };
  const readCell = (r, c) => {
    const cell = sheet[XLSX.utils.encode_cell({ r, c })];
    if (!cell) return null;
    const isDate = cell.t === "n" && isDateFormat(cell.z);
    return { v: cell.v, t: cell.t, w: cell.w, isDate };
  };
  const rowTexts = (r) => {
    const out = [];
    for (let c = range.s.c; c <= range.e.c; c += 1) out.push(normalizeHeader(cellText(readCell(r, c))));
    return out;
  };

  const candidates = [];
  for (let r = range.s.r; r <= range.e.r && candidates.length < HEADER_SCAN_ROWS; r += 1) {
    const texts = rowTexts(r);
    if (texts.some((t) => t !== "")) candidates.push({ r, texts });
  }
  if (!candidates.length) return { sheetName, headers: [], rows: [] };

  let chosen = candidates[0];
  if (fields?.length) {
    let best = -1;
    candidates.forEach((cand) => {
      const score = countHeaderMatches(cand.texts, fields);
      if (score > best) {
        best = score;
        chosen = cand;
      }
    });
    if (best <= 0) chosen = candidates[0];
  }
  const headerRow = chosen.r;
  const headers = [...chosen.texts];
  // Trim trailing empty header columns
  while (headers.length && !headers[headers.length - 1]) headers.pop();

  const rows = [];
  for (let r = headerRow + 1; r <= range.e.r; r += 1) {
    const cells = headers.map((_, i) => readCell(r, range.s.c + i));
    rows.push({ rowNumber: r + 1, cells });
  }

  return { sheetName, headers, rows };
};

const columnWidths = (rows) => {
  const widths = [];
  rows.forEach((row) =>
    row.forEach((value, i) => {
      const len = String(value ?? "").length;
      widths[i] = Math.min(Math.max(widths[i] || 10, len + 2), 60);
    })
  );
  return widths.map((wch) => ({ wch }));
};

/** Build the downloadable template workbook (Data + Instructions + Sample sheets). */
export const buildTemplateWorkbook = (rawFields, sampleRow) => {
  const fields = normalizeFields(rawFields);
  const workbook = XLSX.utils.book_new();
  const headers = buildTemplateHeaders(fields);

  const dataSheet = XLSX.utils.aoa_to_sheet([headers]);
  dataSheet["!cols"] = columnWidths([headers]);
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Data");

  const instructions = buildInstructionRows(fields);
  const instructionSheet = XLSX.utils.aoa_to_sheet([
    ["How to use this template"],
    ["1. Fill one record per row in the \"Data\" sheet. Keep the header row exactly as it is."],
    ["2. Columns marked * are required. Dates are DD/MM/YYYY. Pick values from \"Allowed values\" where listed."],
    ["3. Upload the file with Import Excel — you'll get a preview and can fix problems before anything is saved."],
    [],
    ...instructions,
  ]);
  instructionSheet["!cols"] = columnWidths(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionSheet, "Instructions");

  if (sampleRow && Object.keys(sampleRow).length) {
    const sampleValues = fields.map((f) => sampleCellValue(f, sampleRow[f.key] ?? getPath(sampleRow, f.key)));
    const sampleSheet = XLSX.utils.aoa_to_sheet([headers, sampleValues]);
    sampleSheet["!cols"] = columnWidths([headers, sampleValues]);
    XLSX.utils.book_append_sheet(workbook, sampleSheet, "Sample Data");
  }

  return workbook;
};

/** Build an error report: original columns + an "Import errors" column. */
export const buildErrorWorkbook = (headers, failedRows) => {
  const cleanHeaders = headers.map((h, i) => normalizeHeader(h) || `Column ${i + 1}`);
  const aoa = [
    ["Row in your file", "Import errors", ...cleanHeaders],
    // r.raw is an array aligned with `headers` (older callers may pass an object keyed by header).
    ...failedRows.map((r) => [
      r.rowNumber,
      r.message,
      ...cleanHeaders.map((h, i) => (Array.isArray(r.raw) ? r.raw[i] : r.raw?.[h]) ?? ""),
    ]),
  ];
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet["!cols"] = columnWidths(aoa.slice(0, 50));
  XLSX.utils.book_append_sheet(workbook, sheet, "Errors");
  return workbook;
};

export const writeWorkbookFile = (workbook, filename) => XLSX.writeFile(workbook, filename);
