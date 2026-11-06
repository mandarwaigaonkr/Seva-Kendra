import React from "react";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Light / dark switch. The sun sets and the moon rises (rotate + fade, transform/opacity only);
 * the page itself changes with a circular reveal from this button (see ThemeContext).
 */
const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  const label = dark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={label}
          aria-pressed={dark}
          className={cn(
            "relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md text-muted-foreground transition-colors duration-100 hover:bg-card hover:text-foreground",
            className
          )}
        >
          <Sun
            aria-hidden
            className={cn(
              "absolute h-[18px] w-[18px] transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none",
              dark ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
            )}
          />
          <Moon
            aria-hidden
            className={cn(
              "absolute h-[18px] w-[18px] transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none",
              dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
            )}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
};

export default ThemeToggle;
