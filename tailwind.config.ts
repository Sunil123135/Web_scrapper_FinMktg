import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "./api/**/*.ts"],
  theme: {
    extend: {
      colors: {
        "accent-blue": "#1F3864",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
} satisfies Config;
