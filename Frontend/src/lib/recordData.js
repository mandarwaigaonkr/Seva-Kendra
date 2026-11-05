/**
 * Pure helpers for module record pages (Node-testable; re-exported by ModuleKit).
 * Tests: scripts/test-record-data.mjs
 */

/**
 * Mongoose rejects "" for enum / ObjectId / number fields. Optional Selects start at "",
 * so drop blanks on create and send null on update (null clears the field and passes
 * enum validation). Top-level keys only; nested objects are passed through.
 */
export const toApiPayload = (data, isUpdate = false) =>
  Object.fromEntries(
    Object.entries(data).flatMap(([key, value]) =>
      value === "" ? (isUpdate ? [[key, null]] : []) : [[key, value]]
    )
  );

// First match wins, so negated values ("Not Enrolled", "Incomplete") are caught before
// the positive word inside them ("enrolled", "complete").
const TONE_RULES = [
  [/^(n\/?a|unknown|none|pending review|not (specified|applicable|available|assessed|provided|required))$/i, "neutral"],
  [/^not started$/i, "warning"],
  [/^not\b|\b(incomplete|unresolved|unsuccessful|unapproved)\b/i, "danger"],
  [/(lost|drop|reject|denied|deceased|inactive|closed.*unresolved|relapse|critical|urgent|high|failed)/i, "danger"],
  [/(pending|in progress|in process|ongoing|under|review|follow|applied|scheduled|partial|medium|referred|in rehab|treatment|interrupted)/i, "warning"],
  [/(complete|recovered|resolved|cured|active|approved|linked|received|eligible|passed|success|enrolled|low|yes|done)/i, "success"],
];

/** Maps a free-text status to a badge tone: neutral | danger | warning | success | info. */
export const statusTone = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return "neutral";
  for (const [re, tone] of TONE_RULES) if (re.test(text)) return tone;
  return "info";
};
