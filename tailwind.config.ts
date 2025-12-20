import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)"],
        sans: ["var(--font-sans)"],
      },
      colors: {
        "trainichi-gold": "#FAD9A1",
        "trainichi-forest": "#234235",
      },
    },
  },
  plugins: [],
};

export default config;
