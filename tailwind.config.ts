import type { Config } from "tailwindcss";

// Design tokens repris du projet le-rond-point pour cohérence visuelle.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3B7BF8",
        available: "#10B981",
        busy: "#F59E0B",
        destructive: "#EF4444",
        bg: "#F8FAFF",
        surface: "#FFFFFF",
        "surface-raised": "#F1F6FF",
        fg: "#1E293B",
        muted: "#64748B",
        subtle: "#94A3B8",
        border: "#E2E8F0",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
