import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
 * Buttons: solid jade for the one main action, white outline for everything else.
 * No glow, no scale; hover only darkens. Touch screens get a 44px target.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium select-none " +
    "transition-colors duration-100 disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:mr-0 [&_svg]:ml-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover active:bg-primary-hover",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-card text-foreground shadow-sm hover:bg-accent hover:border-foreground/25",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost: "text-foreground hover:bg-accent",
        link: "h-auto px-0 text-primary underline underline-offset-4 decoration-primary/30 hover:decoration-primary",
        health: "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
      },
      size: {
        default: "h-10 px-4 [@media(pointer:coarse)]:h-11",
        sm: "h-9 px-3 [@media(pointer:coarse)]:h-10",
        lg: "h-11 px-5 text-base",
        icon: "h-10 w-10 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild: _asChild, type = "button", ...props }, ref) => (
  <button type={type} className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
));
Button.displayName = "Button";

export { Button, buttonVariants };
