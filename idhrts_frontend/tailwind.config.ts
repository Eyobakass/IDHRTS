import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          navy: "#111827",
          blue: "#2563EB",
          "blue-hover": "#1D4ED8",
          "blue-dark": "#1E40AF",
          "dark-surface": "#1F2937",
          "dark-surface-2": "#374151",
        },
        status: {
          "active-strip": "#16A34A",
          "pending-strip": "#D97706",
          "rejected-strip": "#DC2626",
          "draft-strip": "#6B7280",
        },
        page: {
          bg: "#F3F4F6",
          surface: "#FFFFFF",
          border: "#E5E7EB",
        },
      },
    },
  },
  plugins: [],
};

export default config;
