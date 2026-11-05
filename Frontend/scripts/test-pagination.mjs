// node --test scripts/test-pagination.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { normalizePagination } from "../src/lib/pagination.js";

test("maps the backend's currentPage/totalRecords shape to page/total too", () => {
  const p = normalizePagination({ currentPage: 2, totalPages: 5, totalRecords: 47, recordsPerPage: 10 });
  assert.deepEqual(
    { page: p.page, limit: p.limit, total: p.total, pages: p.pages },
    { page: 2, limit: 10, total: 47, pages: 5 }
  );
});

test("keeps the page/total shape and adds the backend names", () => {
  const p = normalizePagination({ page: 1, limit: 20, total: 3, pages: 1 });
  assert.equal(p.currentPage, 1);
  assert.equal(p.totalRecords, 3);
  assert.equal(p.recordsPerPage, 20);
});

test("missing or empty pagination falls back to the row count", () => {
  assert.deepEqual(
    (({ page, limit, total, pages }) => ({ page, limit, total, pages }))(normalizePagination(undefined, 4)),
    { page: 1, limit: 10, total: 4, pages: 1 }
  );
});

test("derives pages from total when the server omits it", () => {
  assert.equal(normalizePagination({ total: 21, limit: 10 }).pages, 3);
});
