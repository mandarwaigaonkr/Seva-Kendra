/**
 * Add / edit record panel: slides in from the right, keeps the title fixed at the top,
 * scrolls the fields, and pins the Cancel / Save buttons to the bottom so they are
 * always reachable on long forms (Addiction has ~25 fields).
 *
 * Same shape as the Dialog parts it replaces, so a form dialog converts by renaming:
 *
 *   <FormSheet open={open} onOpenChange={setOpen}>
 *     <FormSheetContent>
 *       <FormSheetHeader><FormSheetTitle>Add record</FormSheetTitle></FormSheetHeader>
 *       <form onSubmit={...}>
 *         ...fields (use grid-cols-1 sm:grid-cols-2; the panel is two columns wide)...
 *         <FormSheetFooter>...buttons...</FormSheetFooter>
 *       </form>
 *     </FormSheetContent>
 *   </FormSheet>
 *
 * The `<form>` must be a direct child of FormSheetContent: it becomes the scrolling area.
 * Clicking the dimmed backdrop does not close the panel (a stray tap would throw away a
 * half-filled form); Escape, the close button and Cancel do.
 */
import React from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const FormSheet = (props) => <Sheet {...props} />;

export const FormSheetContent = ({ className, children, onInteractOutside, ...props }) => (
  <SheetContent
    side="right"
    onInteractOutside={(event) => {
      event.preventDefault();
      onInteractOutside?.(event);
    }}
    className={cn(
      "w-full gap-0 p-0 sm:max-w-2xl",
      "[&>form]:flex [&>form]:min-h-0 [&>form]:flex-1 [&>form]:flex-col [&>form]:overflow-y-auto [&>form]:overscroll-contain [&>form]:px-4 [&>form]:pt-5 sm:[&>form]:px-6 [&>form>*:nth-last-child(2)]:mb-6",
      className,
    )}
    {...props}
  >
    {children}
  </SheetContent>
);

export const FormSheetHeader = ({ className, ...props }) => (
  <SheetHeader className={cn("shrink-0 border-b border-border px-4 py-4 pr-12 sm:px-6", className)} {...props} />
);

export const FormSheetTitle = ({ className, ...props }) => (
  <SheetTitle className={cn("text-lg font-semibold leading-tight", className)} {...props} />
);

export const FormSheetDescription = SheetDescription;

export const FormSheetFooter = ({ className, ...props }) => (
  <SheetFooter
    className={cn(
      "sticky bottom-0 z-10 -mx-4 !mt-auto shrink-0 flex-col-reverse gap-2 border-t border-border bg-card px-4 py-4 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6",
      className,
    )}
    {...props}
  />
);
