export const DEFAULT_PAGE_SIZE = 10;
// Large enough for the record pickers (e.g. choosing an SC student in Competitive Exams),
// small enough that one request cannot pull a whole collection.
export const MAX_PAGE_SIZE = 500;

/**
 * Safe page / limit / skip from untrusted query values.
 * Accepts `getPaginationOptions({ page, limit })` or `getPaginationOptions(page, limit)`.
 * page >= 1; 1 <= limit <= MAX_PAGE_SIZE (0, negative or junk → default).
 * Returns `limitNum` too, for callers written against the positional form.
 */
export const getPaginationOptions = (pageOrOptions, maybeLimit) => {
  const { page: rawPage, limit: rawLimit } =
    pageOrOptions !== null && typeof pageOrOptions === "object"
      ? pageOrOptions
      : { page: pageOrOptions, limit: maybeLimit };

  const page = Math.max(1, parseInt(rawPage, 10) || 1);
  const parsedLimit = parseInt(rawLimit, 10);
  const limit = parsedLimit >= 1 ? Math.min(MAX_PAGE_SIZE, parsedLimit) : DEFAULT_PAGE_SIZE;

  return { page, limit, limitNum: limit, skip: (page - 1) * limit };
};
