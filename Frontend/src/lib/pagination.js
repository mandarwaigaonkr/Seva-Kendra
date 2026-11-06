/**
 * Backend services disagree on pagination keys ({ currentPage, totalPages, totalRecords, recordsPerPage }
 * vs { page, pages, total, limit }). Return an object carrying both, so every page reads what it expects.
 */
export const normalizePagination = (p = {}, fallbackCount = 0) => {
  const page = Number(p.page ?? p.currentPage ?? 1) || 1;
  const limit = Number(p.limit ?? p.recordsPerPage ?? p.perPage ?? 10) || 10;
  const total = Number(p.total ?? p.totalRecords ?? p.totalItems ?? p.count ?? fallbackCount) || 0;
  const pages = Number(p.pages ?? p.totalPages ?? Math.max(1, Math.ceil(total / limit))) || 1;
  return { ...p, page, limit, total, pages, currentPage: page, recordsPerPage: limit, totalRecords: total, totalPages: pages };
};
