import type { Config } from "tailwindcss";

// Cream palette — mirrors the Aretē app's design system.
// Source of truth: workout-planner/mobile/src/theme.ts
// Light-only. Chocolate ink on butter-yellow accent — never white on yellow.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
      },
      colors: {
        cream: {
          bg: "#F0E9DA",
          "bg-secondary": "#E8E0CD",
          surface: "#FAF3E2",
          "surface-elevated": "#FFFFFF",
          ink: "#2A1C12",
          "ink-secondary": "#6A5642",
          "ink-tertiary": "#9C8870",
          accent: "#E8C34A",
          "accent-hover": "#F1E264",
          "accent-pressed": "#B8923A",
          link: "#B8923A",
          border: "#D8CDB4",
          "border-strong": "#B8A884",
          success: "#7A8755",
          warning: "#B8826A",
          error: "#C4513D",
          info: "#6A7C98",
        },
      },
      boxShadow: {
        card: "0 4px 16px rgba(42, 28, 18, 0.08)",
        subtle: "0 2px 8px rgba(42, 28, 18, 0.06)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
