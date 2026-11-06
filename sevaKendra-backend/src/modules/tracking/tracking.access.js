/**
 * Who may see and change follow-ups, and the small date rules they share.
 *
 * A follow-up belongs to one domain (its `module`: Health, Education or Social Justice) and
 * is governed by the same permission as the record it follows: viewing an HIV follow-up
 * needs `health:view`, editing it `health:edit`, and so on. Every tracking query is scoped
 * to the domains the caller holds the permission for, so a user without `health:view`
 * never receives a Health follow-up, its name or its ward.
 */
import { hasPermission } from "../../middleware/permissionMiddleware.js";
import { UserRole } from "../user/user.enum.js";

export const MODULE_FOR_RECORD_TYPE = Object.freeze({
  Adolescents: "Health",
  Elderly: "Health",
  HealthCamps: "Health",
  Tuberculosis: "Health",
  HIV: "Health",
  Leprosy: "Health",
  OtherDiseases: "Health",
  Addiction: "Health",
  PWD: "Health",
  MotherChild: "Health",
  BoardPreparation: "Education",
  CompetitiveExams: "Education",
  Dropouts: "Education",
  Schools: "Education",
  SCStudents: "Education",
  StudyCenters: "Education",
  CBUCBODetails: "Social Justice",
  Entitlements: "Social Justice",
  LegalAid: "Social Justice",
  Workshops: "Social Justice",
});

const PERMISSION_KEY = Object.freeze({
  Health: "health",
  Education: "education",
  "Social Justice": "socialJustice",
});

export const ALL_MODULES = Object.freeze(Object.keys(PERMISSION_KEY));

/** Domains ("Health", ...) in which `user` holds `action`. */
export const allowedModules = (user, action) =>
  ALL_MODULES.filter((module) => hasPermission(user, PERMISSION_KEY[module], action));

/**
 * Route guard: 403 unless the caller holds `action` in at least one domain; otherwise
 * stores those domains on `req.trackingModules` for the service to scope its queries.
 */
export const trackingScope = (action) => (req, res, next) => {
  const modules = allowedModules(req.user, action);
  if (modules.length === 0) {
    return res.status(403).json({
      success: false,
      message: `You don't have permission to ${action} follow-ups`,
    });
  }
  req.trackingModules = modules;
  req.isAdmin = req.user?.role === UserRole.ADMIN;
  return next();
};

/** Adds the domain scope to a Mongo filter. `modules` undefined = internal call, no scope. */
export const scoped = (query, modules) => {
  if (!modules) return query;
  if (query.module) {
    // A filter for a domain the caller cannot see matches nothing.
    return { ...query, module: modules.includes(query.module) ? query.module : { $in: [] } };
  }
  return { ...query, module: { $in: modules } };
};

/**
 * Same calendar day next month, clamped to the month's last day (31 Jan -> 28/29 Feb,
 * not 3 Mar). Computed in UTC so the server's timezone does not shift it.
 */
export const addMonths = (date, months = 1) => {
  const from = new Date(date);
  const target = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + months, 1,
    from.getUTCHours(), from.getUTCMinutes(), from.getUTCSeconds()));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(from.getUTCDate(), lastDay));
  return target;
};

/** 10:00 India time on the same calendar day next month. */
export const nextMonthlyDueDate = (from = new Date()) => {
  const next = addMonths(from, 1);
  // 10:00 IST is 04:30 UTC; take the calendar day as seen in India.
  const ist = new Date(next.getTime() + 330 * 60 * 1000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), 4, 30, 0));
};

export const MONTHLY_CATEGORY = "Monthly follow-up";

/** Auto-created monthly follow-ups; completing one schedules the next. */
export const isMonthlyFollowUp = (tracking) =>
  tracking?.category === MONTHLY_CATEGORY || /^Monthly Follow-up - /.test(tracking?.title || "");

/** Domain for a record type, or undefined (own properties only: "constructor" is not a type). */
export const moduleForRecordType = (recordType) =>
  typeof recordType === "string" && Object.hasOwn(MODULE_FOR_RECORD_TYPE, recordType)
    ? MODULE_FOR_RECORD_TYPE[recordType]
    : undefined;

/**
 * Statuses a user may set directly. Completed and Cancelled only come from the complete /
 * cancel actions, which close the follow-up and (for monthly ones) schedule the next.
 */
export const OPEN_STATUSES = Object.freeze(["Pending", "In Progress", "On Hold"]);

export const LIMITS = Object.freeze({ title: 200, text: 5000, tags: 20, tag: 50 });

/** Fields a user may change on an existing follow-up (PATCH). Identity fields are fixed. */
export const EDITABLE_FIELDS = Object.freeze([
  "title",
  "description",
  "priority",
  "status",
  "followUpDate",
  "nextFollowUpDate",
  "reminderDate",
  "assignedTo",
  "wardNo",
  "habitation",
  "projectResponsible",
  "tags",
  "category",
]);

/**
 * Validates user-supplied follow-up fields (create / PATCH): status must be an open status,
 * the monthly category is reserved for automatic follow-ups, and text sizes are capped.
 * Throws a 400-style message string, returns the cleaned fields.
 */
export const cleanEditable = (fields) => {
  const out = { ...fields };
  if (out.status !== undefined && !OPEN_STATUSES.includes(out.status)) {
    throw new Error(`Status can be ${OPEN_STATUSES.join(", ")}. Use Complete or Cancel to close a follow-up.`);
  }
  if (out.category === MONTHLY_CATEGORY) delete out.category;
  for (const key of ["title", "wardNo", "habitation", "projectResponsible", "category"]) {
    if (typeof out[key] === "string" && out[key].length > LIMITS.title) throw new Error(`${key} is too long`);
  }
  if (typeof out.description === "string" && out.description.length > LIMITS.text) throw new Error("Description is too long");
  if (out.tags !== undefined) {
    if (!Array.isArray(out.tags) || out.tags.length > LIMITS.tags || out.tags.some((t) => typeof t !== "string" || t.length > LIMITS.tag)) {
      throw new Error(`Tags: up to ${LIMITS.tags}, each up to ${LIMITS.tag} characters`);
    }
  }
  return out;
};

export const pick = (source, fields) =>
  Object.fromEntries(fields.filter((f) => source?.[f] !== undefined).map((f) => [f, source[f]]));
