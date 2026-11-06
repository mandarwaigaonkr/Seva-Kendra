/**
 * Input hygiene for every request:
 * - query values are always single strings (a repeated `?q=a&q=b` keeps the last one), so a
 *   handler that builds a filter or regex from a query value never receives an array;
 * - JSON bodies lose any key that starts with "$" or contains ".", so a request body can
 *   never smuggle a MongoDB operator into a filter or update.
 * Runs after the simple query parser (see index.js), which already prevents `a[$ne]=` objects.
 */
const stripOperatorKeys = (value, depth = 0) => {
  if (depth > 20 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => stripOperatorKeys(item, depth + 1));
  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete value[key];
    } else {
      value[key] = stripOperatorKeys(value[key], depth + 1);
    }
  }
  return value;
};

export const sanitizeInput = (req, res, next) => {
  for (const [key, value] of Object.entries(req.query || {})) {
    if (Array.isArray(value)) req.query[key] = value[value.length - 1];
  }
  if (req.body && typeof req.body === "object") stripOperatorKeys(req.body);
  next();
};
