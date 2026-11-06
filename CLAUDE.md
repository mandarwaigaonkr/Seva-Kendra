# Seva Kendra CRM

CRM for an NGO in Kolkata. Three domains — **Education**, **Health**, **Social Justice** — each a set of record modules (22 in total, e.g. Study Centers, Addiction, Legal Aid) with list/create/edit/view, filters, Excel import and monthly follow-up tracking. Users are field staff filling records by hand, often in bulk from spreadsheets.

- `Frontend/` — React 18 + Vite + Tailwind + shadcn/ui. One page per module in `src/pages/`, routes in `src/App.jsx`.
- `sevaKendra-backend/` — Express + Mongoose. Per module: `src/modules/<domain>/{models,services,controllers}`, routes in `src/routers/<domain>/`.

## Running locally

0. Dev database: Docker container `sevakendra-mongo` (mongo:7, volume `sevakendra-mongo-data`, restarts automatically). If missing: `docker run -d --name sevakendra-mongo -p 27017:27017 -v sevakendra-mongo-data:/data/db --restart unless-stopped mongo:7`.
1. `sevaKendra-backend/.env` needs `MONGO_URL` (the README's `MONGODB_URI` is outdated; dev value `mongodb://127.0.0.1:27017/sevakendra`), `JWT_SECRET`, `PORT=5000`, `WHITELIST=http://localhost:5173`.
2. `cd sevaKendra-backend && npm run dev` → http://localhost:5000/api/v1
3. First run only: `node scripts/createAdmin.js` → `admin@sevakendra.com` / `Admin@123`.
4. `cd Frontend && npm run dev` → http://localhost:5173

Production: Render (static site + free web service) and MongoDB Atlas, defined in `render.yaml`. Steps in `DEPLOY.md`.

## Rules

- **The Mongoose model is the source of truth** for a module's fields, types, enums and required flags. Forms, filters, display and import templates follow the model. When the model itself looks wrong, raise it with the user before changing it.
- A field change touches four places together: model → import template (`Frontend/src/lib/excelImport/templates/<module>.js`) → page form/filters/view → verifier run.
- Module pages are built from the shared kit; extend the kit rather than hand-rolling a variant on one page.
- Work inline. For review use the `reviewer` agent, for adversarial testing the `griller` agent (`.claude/agents/`); keep other subagents for when the user asks.
- Commit only when asked, on a feature branch. Personal GitHub account (`mandarwaigaonkr`) — see the global CLAUDE.md for the account check.

## Shared building blocks

| What | Where |
|---|---|
| Import engine (pure, Node-testable): field types `text number integer date boolean enum multiEnum phone email ward`, `required`, `unique`, `options`, `aliases`, `headerAliases`, `transform` | `Frontend/src/lib/excelImport/core.js` (header comment documents the field shape) |
| SheetJS read/write, template + error-report workbooks | `Frontend/src/lib/excelImport/workbook.js` |
| One import template per module (`model:` names its Mongoose file) | `Frontend/src/lib/excelImport/templates/` — `addiction.js` is the reference |
| Import UI: preview → import → error report | `ExcelBulkImportButton.jsx`, wrapped by `ExcelImportPanel.jsx` |
| App shell (persistent sidebar, Ctrl K "Find a section", page Suspense). Pages render only their header + `<main>` | `Frontend/src/components/shell/` — `navigation.js` is the one list of sections (sidebar, search, breadcrumbs, Home) |
| Page kit: `ModulePageHeader` (breadcrumb + mobile menu), `FilterBar`, `tableState`, `StatusBadge`, `formatWard`, `formatDate`, `toDateInput`, `normalizePagination`, `toApiPayload`, `statusTone` (pure ones live in `src/lib/recordData.js`, `src/lib/pagination.js`) | `Frontend/src/components/module/ModuleKit.jsx` |
| Health / Social Justice reports: fetch every page, filter on real model fields (`REPORT_SOURCES` names each category's date, name and status field) | `Frontend/src/lib/reportData.js` |
| Follow-up access rules (domain scoping, editable fields, monthly due dates) | `sevaKendra-backend/src/modules/tracking/tracking.access.js` |
| Sleeping-server handling (free Render API wakes in ~1 min): `serverStatus` state + `/health` polling, `ServerStatusBanner`, sign-in "Waiting for the server…"; `api.js` waits and retries requests once | `Frontend/src/lib/serverStatus.js`, `src/components/ServerStatusBanner.jsx`, `src/lib/api.js` |
| GET cache (30 s, de-duplicated, cleared on any write and on sign-in/out). Pass `{ cache: false }` to `api.get` for always-fresh data | `Frontend/src/lib/requestCache.js` |
| Add/edit record panel (slide-over from the right, sticky Save bar, backdrop click doesn't close). Form fields use `grid-cols-1 sm:grid-cols-2` | `Frontend/src/components/module/FormSheet.jsx` |
| Design tokens (light + dark), type, motion, `#app-content main` column | `Frontend/src/index.css`, `Frontend/tailwind.config.js` |
| Ward options (`"Ward 1"…"Ward 144"`) | `Frontend/src/lib/formOptions.js` → `getWardOptions()` |

## Conventions and gotchas

- **Ward** is stored as `"Ward N"`; display with `formatWard` (plain `"4"` exists in old data).
- **Dates**: date inputs load via `toDateInput()`, display via `formatDate()` (both UTC-safe); import parses DD/MM/YYYY day-first.
- **Optional enum Selects** start at `""`, which Mongoose rejects — submit through `toApiPayload(formData, isUpdate)` (drops `""` on create, sends `null` on update; also inside nested objects such as `functionalAspects`).
- `src/lib/api.js` interceptor returns `response.data` and toasts every error; rejected errors carry `.status`. Wrap bulk calls in `runWithoutErrorToasts`.
- Backend `errorHandler` returns `{ message, success:false }`; Social Justice models normalise enum case in `pre("validate")`.
- `householdCode` is `unique` in several health/education models (one record per household).
- Every module route runs `verifyTokenExists` then `checkPermission("<domain>", action)`: GET → view, POST `/` → create, POST `/:id/...` and PUT → edit, DELETE → delete. New routes follow the same pattern; default users have `view` on all three domains.
- **Auth** re-reads the user on every request: role, permissions and status come from the database, never the token. Deleted → 401, suspended → 403. There is no public sign-up; admins create users (passwords ≥ 8).
- **Follow-ups** (`/tracking`) are scoped by domain permission through `trackingScope(action)`; services take the caller's `modules` and must pass them to every query. PATCH only accepts `EDITABLE_FIELDS`. Completing a monthly follow-up schedules the next; deleting a record closes its follow-ups (`closeFollowUpsOnDelete` on each DELETE `/:id`).
- **Untrusted input**: user text in `$regex` / `new RegExp` goes through `escapeRegex` (`src/utils/regex.utils.js`). Query strings use Express's simple parser and `sanitizeInput` (values are strings; `$`/dotted keys stripped from bodies). Paging goes through `getPaginationOptions` (1–500 per page).
- **Design system**: Atkinson Hyperlegible Next (slashed zero is the font, not a bug); weights 400/500/600 only (`font-bold` maps to 600); one jade accent; domain colours (`text-domain-*`) only as small wayfinding marks; motion 100–300ms, transform/opacity only. Use tokens (`bg-card`, `text-muted-foreground`, `text-destructive`), not raw palette colours — dark mode depends on it.
- Dialogs are centred with `inset-0 m-auto`, never translate — the enter animation owns `transform`.
- Backend list endpoints return `{ currentPage, totalPages, totalRecords }`; wrap with `normalizePagination`.
- `<Button>` defaults to `type="button"`; form submits need `type="submit"`.
- `TBHIVAddict.jsx` is not routed (dead page).
- ESLint prints many `no-unused-vars` warnings for JSX-only identifiers — pre-existing noise; errors are what count.
- Git `autocrlf` normalises line endings on commit; mixed endings in the working tree are fine.

## Done criteria (run from `Frontend/`)

A change is done when every one of these is green:

- `node scripts/verify-import-templates.mjs` — every template round-trips through the parser and validates against its real model (0 errors, 0 warnings).
- `node --test scripts/test-excel-import.mjs` — import-engine suite, all pass.
- `node scripts/check-form-options.mjs` — every literal `<SelectItem>` value is a model enum value.
- `npm run build` succeeds; `npx eslint <changed files>` has 0 errors; `npx eslint -c .jsx-undef.config.js src/pages src/components` has 0 errors (catches JSX components used without an import, which the build does not).
- `node --test scripts/test-pagination.mjs scripts/test-record-data.mjs scripts/test-report-data.mjs scripts/test-server-status.mjs` pass.
- UI changes: screenshot the changed page at 375 and 1280, light and dark.
- When the backend is running against the dev DB: `node scripts/e2e-smoke.mjs` — imports every template's sample row through the live API, checks view-only users get 403 on create/delete, then cleans up. Also `node scripts/e2e-security.mjs` — follow-up scoping, suspended/deleted users, removed endpoints, query injection, headers.

## Open backend issues (awaiting a decision from the user)

- `entitlements.idCode` is `unique` but optional and not `sparse` → only one record may omit it.
- `Entitlements.getStats` groups on `$idProofDetails.status` (should be `idProofAndDomicile`).
- Editing cannot clear an optional enum (unset values are dropped from the payload; needs `$unset`).
