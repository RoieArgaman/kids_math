import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-rubik)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "kid-purple": {
          50:  "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7c3aed",
        },
        "kid-orange": {
          50:  "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
        },
        "kid-green": {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        "kid-yellow": {
          50:  "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
        },
        "kid-blue": {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        "kid-pink": {
          50:  "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
        },
      },
      borderRadius: {
        kid:  "20px",
        pill: "9999px",
      },
      boxShadow: {
        kid:    "0 4px 20px rgba(0, 0, 0, 0.08)",
        "kid-lg": "0 8px 32px rgba(0, 0, 0, 0.12)",
      },
      animation: {
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        wiggle:      "wiggle 0.4s ease",
        float:       "float 3s ease-in-out infinite",
      },
      keyframes: {
        "bounce-in": {
          "0%":   { transform: "scale(0.5)", opacity: "0" },
          "60%":  { transform: "scale(1.1)", opacity: "1" },
          "80%":  { transform: "scale(0.96)" },
          "100%": { transform: "scale(1)",   opacity: "1" },
        },
        wiggle: {
          "0%":   { transform: "rotate(0deg)"  },
          "20%":  { transform: "rotate(-6deg)" },
          "40%":  { transform: "rotate(6deg)"  },
          "60%":  { transform: "rotate(-4deg)" },
          "80%":  { transform: "rotate(4deg)"  },
          "100%": { transform: "rotate(0deg)"  },
        },
        float: {
          "0%":   { transform: "translateY(0px)"  },
          "50%":  { transform: "translateY(-8px)" },
          "100%": { transform: "translateY(0px)"  },
        },
      },
    },
  },
  plugins: [],
};
export default config;
