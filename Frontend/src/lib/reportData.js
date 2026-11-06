/**
 * Module report builder (pure, Node-testable). Tests: scripts/test-report-data.mjs
 *
 * List endpoints return different shapes ({ hiv: [...] }, { data: [...] }, { elderly: [...] })
 * and filter on different query keys, so reports fetch every page of a module and filter
 * here, on the fields each model really has (see REPORT_SOURCES).
 */
import { statusTone } from "./recordData.js";

/**
 * Per report category: which field dates a record, which names it, and which holds its
 * main status (null when the model has no overall status, e.g. Elderly, Health Camps).
 */
export const REPORT_SOURCES = Object.freeze({
  "health-camps": { date: "dateOfCamp", name: ["targetGroup", "organiser"], status: null },
  elderly: { date: "dateOfReporting", name: ["name"], status: null },
  "mother-child": { date: "dateOfReporting", name: ["nameOfMother", "nameOfChild"], status: "immunizationStatus" },
  pwd: { date: "dateOfReporting", name: ["name"], status: "udidCardStatus" },
  adolescents: { date: "dateOfReporting", name: ["name"], status: "nutritionalStatus" },
  tuberculosis: { date: "dateOfReporting", name: ["name"], status: "overallStatus" },
  hiv: { date: "dateOfReporting", name: ["name"], status: "overallStatus" },
  leprosy: { date: "dateOfReporting", name: ["name"], status: "overallStatus" },
  addiction: { date: "dateOfReporting", name: ["name"], status: "overallStatus" },
  "other-diseases": { date: "dateOfReporting", name: ["name"], status: "overallStatus" },
  cbucbo: { date: "dateOfFormation", name: ["groupName"], status: null },
  entitlements: { date: "dateOfReporting", name: ["name"], status: "status" },
  "legal-aid": { date: "dateOfReporting", name: ["name"], status: "status" },
  workshops: { date: "dateOfTraining", name: ["groupName", "topic"], status: null },
});

/** The record array inside a list response, whatever the module calls it. */
export const listFromResponse = (response) => {
  const body = response?.data ?? response;
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    if (Array.isArray(body.data)) return body.data;
    const firstArray = Object.values(body).find(Array.isArray);
    if (firstArray) return firstArray;
  }
  return [];
};

/** Total pages from either { pagination: {...} } or top-level { totalPages }. */
export const pagesFromResponse = (response) => {
  const body = response?.data ?? response ?? {};
  const p = body.pagination || body;
  return Number(p.pages ?? p.totalPages ?? 1) || 1;
};

/** Fetches every page (up to maxPages) of a module's list endpoint. */
export const fetchAllRecords = async (getAll, { pageSize = 500, maxPages = 40 } = {}) => {
  const records = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const response = await getAll({ page, limit: pageSize });
    const batch = listFromResponse(response);
    records.push(...batch);
    if (batch.length < pageSize || page >= pagesFromResponse(response)) break;
  }
  return records;
};

/** "4", "ward 4", "Ward 4" → "ward 4" for comparison. */
const wardKey = (value) => {
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return "";
  return /^ward\b/.test(s) ? s.replace(/\s+/g, " ") : `ward ${s}`;
};

/** Report bucket of a status value: completed | pending | inactive | active | null. */
export const statusBucket = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const tone = statusTone(value);
  if (tone === "success") return "completed";
  if (tone === "warning") return "pending";
  if (tone === "danger") return "inactive";
  return "active";
};

const inDateRange = (value, startDate, endDate) => {
  if (!startDate && !endDate) return true;
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return false; // missing or unreadable date
  const day = date.toISOString().slice(0, 10); // dates are stored as UTC midnight
  return (!startDate || day >= startDate) && (!endDate || day <= endDate);
};

/**
 * Filters and summarises records for one category.
 * filters: { startDate, endDate (yyyy-mm-dd), name, wardNo, habitation, status (bucket) }
 */
export const buildReport = (category, rawRecords, filters = {}) => {
  const source = REPORT_SOURCES[category];
  if (!source) throw new Error("Unknown category for report generation");

  const nameNeedle = String(filters.name || "").trim().toLowerCase();
  const habitationNeedle = String(filters.habitation || "").trim().toLowerCase();
  const ward = wardKey(filters.wardNo);
  const wantedBucket = filters.status && filters.status !== "all" ? filters.status : null;

  const records = rawRecords
    .map((record) => {
      const name = source.name.map((f) => record[f]).filter(Boolean).join(" / ");
      const status = source.status ? record[source.status] : undefined;
      return {
        ...record,
        name: name || record.name || "",
        status: status ?? "",
        date: record[source.date] || record.createdAt,
        _bucket: statusBucket(status),
      };
    })
    .filter((r) => inDateRange(r.date, filters.startDate, filters.endDate))
    .filter((r) => !nameNeedle || r.name.toLowerCase().includes(nameNeedle))
    .filter((r) => !ward || wardKey(r.wardNo) === ward)
    .filter((r) => !habitationNeedle || String(r.habitation || "").toLowerCase().includes(habitationNeedle))
    .filter((r) => !wantedBucket || r._bucket === wantedBucket);

  const count = (bucket) => records.filter((r) => r._bucket === bucket).length;
  const totalRecords = records.length;
  const completed = count("completed");

  const monthCounts = new Array(12).fill(0);
  records.forEach((r) => {
    const d = new Date(r.date);
    if (!Number.isNaN(d.getTime())) monthCounts[d.getUTCMonth()] += 1;
  });

  return {
    report: {
      summary: {
        totalRecords,
        active: count("active"),
        pending: count("pending"),
        completed,
        inactive: count("inactive"),
        completionRate: totalRecords ? Math.round((completed / totalRecords) * 100) : 0,
        statusField: source.status,
        dateField: source.date,
      },
      records,
    },
    chartData: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      datasets: [{ label: "Records", data: monthCounts }],
    },
  };
};
