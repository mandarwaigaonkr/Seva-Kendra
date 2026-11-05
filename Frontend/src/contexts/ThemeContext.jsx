import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";

const STORAGE_KEY = "theme";

export const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

const readInitial = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* storage blocked — fall through to the system setting */
  }
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyClass = (theme) => {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#121614" : "#F4F5F2");
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(readInitial);

  useEffect(() => {
    applyClass(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* not persisted this time */
    }
  }, [theme]);

  /**
   * Switch theme. When called from a click, the new theme spreads out as a circle from the
   * button (View Transitions API). Browsers without it, or people who prefer reduced motion,
   * get an instant switch.
   */
  const toggleTheme = useCallback(
    (event) => {
      const next = theme === "dark" ? "light" : "dark";
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (!document.startViewTransition || reduce) {
        setTheme(next);
        return;
      }

      const rect = event?.currentTarget?.getBoundingClientRect?.();
      const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

      const transition = document.startViewTransition(() => {
        flushSync(() => setTheme(next));
        applyClass(next);
      });
      transition.ready
        .then(() => {
          document.documentElement.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            // Deliberately slower than other motion (user preference): a calm, visible sweep.
            { duration: 700, easing: "cubic-bezier(0.45, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
          );
        })
        .catch(() => {});
    },
    [theme]
  );

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
