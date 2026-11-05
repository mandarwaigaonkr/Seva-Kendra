import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Data tables: scroll inside their own region; the last column (row actions) stays pinned on the right
 * so Edit / Delete are always visible. Quiet header band,
 * hairline rows, 14px cells (never meta size), tabular numbers.
 */
function Table({ className, ...props }) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table data-slot="table" className={cn("w-full caption-bottom border-collapse text-sm", className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b [&_tr]:border-border [&_tr:hover]:bg-transparent", className)} {...props} />;
}

function TableBody({ className, ...props }) {
  return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableFooter({ className, ...props }) {
  return <tfoot data-slot="table-footer" className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />;
}

function TableRow({ className, ...props }) {
  return (
    <tr
      data-slot="table-row"
      className={cn("group border-b border-border transition-colors duration-100 hover:bg-muted data-[state=selected]:bg-primary-soft", className)}
      {...props}
    />
  );
}

function TableHead({ className, ...props }) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-11 whitespace-nowrap bg-muted px-4 text-left align-middle text-sm font-medium text-muted-foreground first:pl-5 last:pr-5 [&:has([role=checkbox])]:pr-0 last:sticky last:right-0 last:z-[1] last:shadow-[-1px_0_0_hsl(var(--border))]",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }) {
  return (
    <td
      data-slot="table-cell"
      className={cn("min-w-[7rem] max-w-[22rem] px-4 py-3 first:whitespace-nowrap align-middle text-foreground first:pl-5 last:pr-5 [&:has([role=checkbox])]:pr-0 last:sticky last:right-0 last:min-w-0 last:whitespace-nowrap last:bg-card last:shadow-[-1px_0_0_hsl(var(--border))] group-hover:last:bg-muted", className)}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }) {
  return <caption data-slot="table-caption" className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
