import React from "react";
import { ChevronDown, Lightbulb } from "lucide-react";

/**
 * Record-keeping tips for a module. Folded into one line by default so the records stay
 * on the first screen; staff open it when they need a reminder.
 */
const GuidelinesCard = ({ title, description, items = [] }) => (
  <details className="group mb-4 rounded-lg border border-border bg-card shadow-sm open:pb-1">
    <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-lg px-4 text-[0.9375rem] font-medium text-foreground hover:bg-accent/60 [&::-webkit-details-marker]:hidden">
      <Lightbulb className="h-[18px] w-[18px] shrink-0 text-warning" aria-hidden />
      <span className="flex-1">{title || "How to fill in these records"}</span>
      <span className="hidden text-sm font-normal text-muted-foreground sm:inline group-open:hidden">Show tips</span>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-open:rotate-180" aria-hidden />
    </summary>
    <div className="px-4 pb-4 pl-11">
      {description && <p className="mb-2 max-w-[70ch] text-[0.9375rem] text-muted-foreground">{description}</p>}
      <ul className="max-w-[70ch] list-disc space-y-1 pl-5 text-[0.9375rem] text-foreground/90 marker:text-muted-foreground">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  </details>
);

export default GuidelinesCard;
