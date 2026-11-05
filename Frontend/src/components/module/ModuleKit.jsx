/**
 * Shared building blocks for module list pages (Education / Health / Social Justice).
 * Use these instead of hand-rolled headers, loading rows and badges so every module
 * looks and behaves the same.
 */
import React from "react";
import { ChevronDown, ChevronRight, Inbox, Menu, SlidersHorizontal } from "lucide-react";
import { useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useShell } from "@/components/shell/AppShell";
import { DOMAIN_TONE, locate } from "@/components/shell/navigation";

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

/**
 * Page header used by every module page: where you are (breadcrumb), what this page is,
 * and its main actions. Sticks to the top so "Add" is always one tap away.
 * `icon`, `accent` and `onToggleSidebar` are accepted for older callers; the menu button
 * opens the shell navigation on small screens.
 */
export const ModulePageHeader = ({ title, subtitle, actions, children }) => {
  const { pathname } = useLocation();
  const { openNav } = useShell();
  const { domain } = locate(pathname);
  const tone = domain ? DOMAIN_TONE[domain.tone] : null;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background">
      <div className="shell-gutter flex flex-wrap items-end justify-between gap-x-6 gap-y-3 py-4 sm:py-5">
        <div className="flex min-w-0 items-start gap-2">
          <Button variant="ghost" size="icon" onClick={openNav} className="-ml-2 shrink-0 lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            {domain && (
              <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <span aria-hidden className={cn("h-2 w-2 rounded-full", tone.bg)} />
                <span>{domain.name}</span>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                <span aria-current="page" className="truncate text-foreground/80">{title}</span>
              </nav>
            )}
            <h1 className="truncate text-2xl font-semibold leading-tight text-foreground sm:text-[1.75rem]">{title}</h1>
            {subtitle && <p className="mt-1 max-w-[70ch] text-[0.9375rem] text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
};

/* ------------------------------------------------------------------ */
/* Table loading / empty rows                                          */
/* ------------------------------------------------------------------ */

export const TableLoadingRows = ({ colSpan, rows = 5 }) =>
  Array.from({ length: rows }, (_, i) => (
    <TableRow key={`loading-${i}`} aria-hidden="true">
      {Array.from({ length: colSpan }, (_, c) => (
        <TableCell key={c} className="py-3">
          <div className={cn("h-4 rounded bg-muted animate-pulse motion-reduce:animate-none", c === 0 ? "w-24" : c === colSpan - 1 ? "w-16 ml-auto" : "w-full max-w-[10rem]")} />
        </TableCell>
      ))}
    </TableRow>
  ));

export const TableEmptyRow = ({ colSpan, title = "No records yet", hint, action, filtered = false }) => (
  <TableRow className="hover:bg-transparent">
    <TableCell colSpan={colSpan} className="py-14">
      <div className="flex flex-col items-center text-center gap-2">
        <Inbox className="h-8 w-8 text-muted-foreground/70" strokeWidth={1.5} aria-hidden />
        <p className="text-base font-medium text-foreground">{filtered ? "No records match your filters" : title}</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          {hint || (filtered ? "Try clearing a filter or searching for something else." : "Add a record or import an Excel file to get started.")}
        </p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </TableCell>
  </TableRow>
);

/**
 * Convenience wrapper: renders loading rows, an empty state, or nothing.
 * {tableState({ loading, count: records.length, colSpan: 8, filtered: hasFilters })}
 */
export const tableState = ({ loading, count, colSpan, filtered, emptyTitle, emptyHint, emptyAction }) => {
  if (loading) return <TableLoadingRows colSpan={colSpan} />;
  if (!count) return <TableEmptyRow colSpan={colSpan} filtered={filtered} title={emptyTitle} hint={emptyHint} action={emptyAction} />;
  return null;
};

/* ------------------------------------------------------------------ */
/* Status badge                                                        */
/* ------------------------------------------------------------------ */

const TONES = {
  success: { pill: "bg-success/10 text-success", dot: "bg-success" },
  info: { pill: "bg-info/10 text-info", dot: "bg-info" },
  warning: { pill: "bg-warning/10 text-warning", dot: "bg-warning" },
  danger: { pill: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  neutral: { pill: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/60" },
};

const TONE_RULES = [
  [/^(n\/?a|unknown|not specified|pending review)$/i, "neutral"],
  [/(lost|drop|reject|denied|deceased|inactive|closed.*unresolved|relapse|critical|urgent|high|failed|not linked|not eligible)/i, "danger"],
  [/(pending|in progress|ongoing|under|review|follow|applied|scheduled|partial|medium|referred|in rehab|treatment)/i, "warning"],
  [/(complete|recovered|resolved|cured|active|approved|linked|received|eligible|passed|success|enrolled|low|yes|done)/i, "success"],
];

export const statusTone = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return "neutral";
  for (const [re, tone] of TONE_RULES) if (re.test(text)) return tone;
  return "info";
};

/** Coloured, consistent status pill. Pass `tone` to override the automatic mapping. */
export const StatusBadge = ({ value, tone, className, fallback = "—" }) => {
  const text = value === undefined || value === null || value === "" ? null : String(value);
  if (!text) return <span className="text-muted-foreground">{fallback}</span>;
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-medium", TONES[tone || statusTone(text)].pill, className)}>
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", TONES[tone || statusTone(text)].dot)} />
      {text}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

/** "Ward 4" for both "4" and "Ward 4" — avoids "Ward Ward 4". */
export const formatWard = (value) => {
  if (value === undefined || value === null || value === "") return "—";
  const s = String(value).trim();
  return /^ward\b/i.test(s) ? s.replace(/^ward/i, "Ward") : `Ward ${s}`;
};

/** 15 Aug 2024 — timezone-safe for date-only values stored as UTC midnight. */
export const formatDate = (value, fallback = "—") => {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
};

/** yyyy-mm-dd for <input type="date"> from a stored date, timezone-safe. */
export const toDateInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

/* ------------------------------------------------------------------ */
/* Filter bar                                                          */
/* ------------------------------------------------------------------ */

const useIsWide = (query = "(min-width: 768px)") => {
  const get = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : true);
  const [wide, setWide] = React.useState(get);
  React.useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return wide;
};

/**
 * Search + filters for a list. Always visible on wide screens; on phones it folds behind one
 * "Search and filter" button so the records are on the first screen.
 */
export const FilterBar = ({ children, className }) => {
  const wide = useIsWide();
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  const show = wide || open;
  return (
    <section aria-label="Search and filter" className={cn("mb-4 rounded-lg border border-border bg-card shadow-sm", className)}>
      {!wide && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-12 w-full items-center gap-3 rounded-lg px-4 text-left text-[0.9375rem] font-medium text-foreground"
        >
          <SlidersHorizontal className="h-[18px] w-[18px] text-muted-foreground" aria-hidden />
          <span className="flex-1">Search and filter</span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-150", open && "rotate-180")} aria-hidden />
        </button>
      )}
      {show && (
        <div id={id} className={cn("p-4", !wide && "border-t border-border")}>
          {children}
        </div>
      )}
    </section>
  );
};

export { normalizePagination } from "@/lib/pagination";
