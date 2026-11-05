/**
 * Shared building blocks for module list pages (Education / Health / Social Justice).
 * Use these instead of hand-rolled headers, loading rows and badges so every module
 * looks and behaves the same.
 */
import React from "react";
import { Inbox, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

export const ModulePageHeader = ({ icon: Icon, title, subtitle, onToggleSidebar, actions, accent = "text-primary" }) => (
  <header className="sticky top-0 z-10 bg-background border-b border-border">
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden" aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        {Icon && (
          <span className={cn("hidden sm:inline-flex rounded-lg bg-muted p-2", accent)}>
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </header>
);

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
        <span className="rounded-full bg-muted p-3 text-muted-foreground">
          <Inbox className="h-6 w-6" />
        </span>
        <p className="font-medium text-foreground">{filtered ? "No records match your filters" : title}</p>
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
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  danger: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  neutral: "border-border bg-muted text-muted-foreground",
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
    <Badge variant="outline" className={cn("font-medium", TONES[tone || statusTone(text)], className)}>
      {text}
    </Badge>
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
