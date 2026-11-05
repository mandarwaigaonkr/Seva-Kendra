# Seva Kendra CRM

CRM for an NGO in Kolkata. Three domains — **Education**, **Health**, **Social Justice** — each a set of record modules (22 in total, e.g. Study Centers, Addiction, Legal Aid) with list/create/edit/view, filters, Excel import and monthly follow-up tracking. Users are field staff filling records by hand, often in bulk from spreadsheets.

- `Frontend/` — React 18 + Vite + Tailwind + shadcn/ui. One page per module in `src/pages/`, routes in `src/App.jsx`.
- `sevaKendra-backend/` — Express + Mongoose. Per module: `src/modules/<domain>/{models,services,controllers}`, routes in `src/routers/<domain>/`.

## Running locally

1. `sevaKendra-backend/.env` needs `MONGO_URL` (the README's `MONGODB_URI` is outdated), `JWT_SECRET`, `PORT=5000`, `WHITELIST=http://localhost:5173`.
2. `cd sevaKendra-backend && npm run dev` → http://localhost:5000/api/v1
3. First run only: `node scripts/createAdmin.js` → `admin@sevakendra.com` / `Admin@123`.
4. `cd Frontend && npm run dev` → http://localhost:5173

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
| Page kit: `ModulePageHeader`, `tableState`, `StatusBadge`, `formatWard`, `formatDate`, `toDateInput` | `Frontend/src/components/module/ModuleKit.jsx` |
| Ward options (`"Ward 1"…"Ward 144"`) | `Frontend/src/lib/formOptions.js` → `getWardOptions()` |

## Conventions and gotchas

- **Ward** is stored as `"Ward N"`; display with `formatWard` (plain `"4"` exists in old data).
- **Dates**: date inputs load via `toDateInput()`, display via `formatDate()` (both UTC-safe); import parses DD/MM/YYYY day-first.
- **Optional enum Selects** start at `""`, which Mongoose rejects — send `undefined` for unset optional enums.
- `src/lib/api.js` interceptor returns `response.data` and toasts every error; rejected errors carry `.status`. Wrap bulk calls in `runWithoutErrorToasts`.
- Backend `errorHandler` returns `{ message, success:false }`; Social Justice models normalise enum case in `pre("validate")`.
- `householdCode` is `unique` in several health/education models (one record per household).
- Every module route runs `verifyTokenExists` then `checkPermission("<domain>", action)`: GET → view, POST `/` → create, POST `/:id/...` and PUT → edit, DELETE → delete. New routes follow the same pattern; default users have `view` on all three domains.
- `TBHIVAddict.jsx` is not routed (dead page). `/auth/dummy-login` is dev-only.
- ESLint prints many `no-unused-vars` warnings for JSX-only identifiers — pre-existing noise; errors are what count.
- Git `autocrlf` normalises line endings on commit; mixed endings in the working tree are fine.

## Done criteria (run from `Frontend/`)

A change is done when every one of these is green:

- `node scripts/verify-import-templates.mjs` — every template round-trips through the parser and validates against its real model (0 errors, 0 warnings).
- `node --test scripts/test-excel-import.mjs` — import-engine suite, all pass.
- `node scripts/check-form-options.mjs` — every literal `<SelectItem>` value is a model enum value.
- `npm run build` succeeds; `npx eslint <changed files>` has 0 errors.

## Open backend issues (awaiting a decision from the user)

- `entitlements.idCode` is `unique` but optional and not `sparse` → only one record may omit it.
- `Entitlements.getStats` groups on `$idProofDetails.status` (should be `idProofAndDomicile`).
- `studyCenter.service` search runs `$regex` against the `groupLeader` ObjectId.
- Editing cannot clear an optional enum (unset values are dropped from the payload; needs `$unset`).
