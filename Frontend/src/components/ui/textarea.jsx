import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm",
      "placeholder:text-muted-foreground/80 transition-colors duration-100 hover:border-foreground/30",
      "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
      "aria-[invalid=true]:border-destructive disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
