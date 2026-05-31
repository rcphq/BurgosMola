import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#C2410C",
          light: "#EA580C",
          dark: "#9A3412",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
