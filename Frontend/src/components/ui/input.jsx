import * as React from "react";
import { cn } from "@/lib/utils";

/* 16px text (readable, and stops iOS zooming on focus); 3:1 field edge; jade ring on focus. */
const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-md border border-input bg-card px-3 text-base text-foreground shadow-sm [@media(pointer:coarse)]:h-11",
      "placeholder:text-muted-foreground/80 file:border-0 file:bg-transparent file:text-sm file:font-medium",
      "transition-colors duration-100 hover:border-foreground/30",
      "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
      "aria-[invalid=true]:border-destructive disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
