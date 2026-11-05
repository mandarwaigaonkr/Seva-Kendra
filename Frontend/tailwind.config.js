import tailwindcssAnimate from "tailwindcss-animate";
import defaultTheme from "tailwindcss/defaultTheme";

const token = (name) => `hsl(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1280px" } },
    extend: {
      fontFamily: {
        // Atkinson Hyperlegible Next: designed for low-vision readers. Bengali/Devanagari names fall back to system faces.
        sans: ['"Atkinson Hyperlegible Next"', "Nirmala UI", '"Noto Sans Bengali"', ...defaultTheme.fontFamily.sans],
      },
      // Typography rule: three weights, nothing above 600. Old pages using bold/extrabold land on 600.
      fontWeight: { bold: "600", extrabold: "600", black: "600" },
      colors: {
        border: token("border"),
        input: token("input"),
        ring: token("ring"),
        background: token("background"),
        foreground: token("foreground"),
        sidebar: token("sidebar"),
        primary: { DEFAULT: token("primary"), hover: token("primary-hover"), soft: token("primary-soft"), foreground: token("primary-foreground") },
        secondary: { DEFAULT: token("secondary"), foreground: token("secondary-foreground") },
        destructive: { DEFAULT: token("destructive"), foreground: token("destructive-foreground") },
        success: { DEFAULT: token("success"), foreground: token("success-foreground") },
        warning: { DEFAULT: token("warning"), foreground: token("warning-foreground") },
        info: { DEFAULT: token("info"), foreground: token("info-foreground") },
        muted: { DEFAULT: token("muted"), foreground: token("muted-foreground") },
        accent: { DEFAULT: token("accent"), foreground: token("accent-foreground") },
        popover: { DEFAULT: token("popover"), foreground: token("popover-foreground") },
        card: { DEFAULT: token("card"), foreground: token("card-foreground") },
        domain: { education: token("domain-education"), health: token("domain-health"), social: token("domain-social") },
        // Legacy names used by a couple of pages; now mapped onto the token palette.
        health: { primary: token("primary"), secondary: token("primary-hover"), accent: token("primary"), light: token("muted"), dark: token("primary-hover") },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // Light elevation only (colour-palette: alpha < 0.08).
        sm: "0 1px 2px rgba(16, 24, 20, 0.05)",
        DEFAULT: "0 1px 3px rgba(16, 24, 20, 0.06)",
        md: "0 2px 8px rgba(16, 24, 20, 0.06)",
        lg: "0 8px 24px rgba(16, 24, 20, 0.07)",
        xl: "0 12px 32px rgba(16, 24, 20, 0.07)",
        "2xl": "0 16px 48px rgba(16, 24, 20, 0.07)",
      },
      transitionDuration: { DEFAULT: "150ms" },
      transitionTimingFunction: { DEFAULT: "cubic-bezier(0.16, 1, 0.3, 1)" },
      keyframes: {
        // Dialogs rise 8px and fade in; they are centred with margins, not transforms, so nothing jumps sideways.
        "dialog-in": { from: { opacity: "0", transform: "translateY(8px) scale(0.98)" }, to: { opacity: "1", transform: "none" } },
        "dialog-out": { from: { opacity: "1", transform: "none" }, to: { opacity: "0", transform: "translateY(4px) scale(0.98)" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-out": { from: { opacity: "1" }, to: { opacity: "0" } },
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "dialog-in": "dialog-in 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        "dialog-out": "dialog-out 150ms cubic-bezier(0.7, 0, 0.84, 0) forwards",
        "overlay-in": "fade-in 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        "overlay-out": "fade-out 150ms cubic-bezier(0.7, 0, 0.84, 0) forwards",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
