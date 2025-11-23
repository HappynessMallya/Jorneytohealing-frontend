import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // BetterHelp-inspired color palette
        primary: {
          DEFAULT: "#1A7F64", // Dark teal green (BetterHelp brand)
          hover: "#155D48",
          light: "#2A9D7F",
          lighter: "#E8F5F1",
        },
        secondary: {
          DEFAULT: "#F5F7F4", // Off-white/cream background
          dark: "#E8EBE6",
        },
        accent: {
          DEFAULT: "#FEFCF8", // Warm off-white
          green: "#A8D5BA", // Light muted green
        },
        text: {
          DEFAULT: "#2C3E35", // Dark grey-green
          light: "#5A6B63",
          lighter: "#8A9A92",
        },
        warm: {
          DEFAULT: "#F9E5D8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)",
        medium: "0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)",
        large: "0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)",
      },
      backgroundImage: {
        "wave-pattern": "url(\"data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264.088-.437l-2.443-4.316c-.51-.902-1.511-1.507-2.583-1.507s-2.073.605-2.583 1.507l-2.443 4.316c-.632.173-.272.307.089.437H21.184zm16.09 0c.357-.13.72-.264.088-.437l-2.443-4.316c-.51-.902-1.511-1.507-2.583-1.507s-2.073.605-2.583 1.507l-2.443 4.316c-.632.173-.272.307.089.437H37.274zm16.09 0c.357-.13.72-.264.088-.437l-2.443-4.316c-.51-.902-1.511-1.507-2.583-1.507s-2.073.605-2.583 1.507l-2.443 4.316c-.632.173-.272.307.089.437H53.364zm16.09 0c.357-.13.72-.264.088-.437l-2.443-4.316c-.51-.902-1.511-1.507-2.583-1.507s-2.073.605-2.583 1.507l-2.443 4.316c-.632.173-.272.307.089.437H69.454zm16.09 0c.357-.13.72-.264.088-.437l-2.443-4.316c-.51-.902-1.511-1.507-2.583-1.507s-2.073.605-2.583 1.507l-2.443 4.316c-.632.173-.272.307.089.437H85.544z' fill='%23A8D5BA' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

