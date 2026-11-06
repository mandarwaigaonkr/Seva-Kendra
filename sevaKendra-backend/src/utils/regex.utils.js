/**
 * Turns user text into a literal pattern for MongoDB `$regex` / `new RegExp`, so a search
 * for "(" or ".*" matches those characters instead of failing or scanning everything.
 * Input is capped at 100 characters.
 */
export const escapeRegex = (value) =>
  String(value ?? "")
    .slice(0, 100)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
