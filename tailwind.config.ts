import type { Config } from "tailwindcss";

const alpha = (token: string) => `rgb(var(${token}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        black: {
          950: alpha("--color-black-950-rgb"),
          900: alpha("--color-black-900-rgb"),
        },
        charcoal: { 800: alpha("--color-charcoal-800-rgb") },
        ivory: {
          100: alpha("--color-ivory-100-rgb"),
          50: alpha("--color-ivory-50-rgb"),
        },
        gold: {
          500: alpha("--color-gold-500-rgb"),
          600: alpha("--color-gold-600-rgb"),
          100: alpha("--color-gold-100-rgb"),
        },
        gray: {
          700: alpha("--color-gray-700-rgb"),
          500: alpha("--color-gray-500-rgb"),
          300: alpha("--color-gray-300-rgb"),
          100: alpha("--color-gray-100-rgb"),
        },
        success: alpha("--color-success-rgb"),
        error: alpha("--color-error-rgb"),
        warning: alpha("--color-warning-rgb"),
        info: alpha("--color-info-rgb"),
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      fontSize: {
        hero: ["var(--text-hero)", { lineHeight: "1.1" }],
        h1: ["var(--text-h1)", { lineHeight: "1.15" }],
        h2: ["var(--text-h2)", { lineHeight: "1.25" }],
        h3: ["var(--text-h3)", { lineHeight: "1.3" }],
        "body-lg": ["var(--text-body-lg)", { lineHeight: "1.6" }],
        body: ["var(--text-body)", { lineHeight: "1.6" }],
        caption: ["var(--text-caption)", { lineHeight: "1.5" }],
        micro: [
          "var(--text-micro)",
          { lineHeight: "1.4", letterSpacing: "0.02em" },
        ],
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        7: "var(--space-7)",
        8: "var(--space-8)",
        9: "var(--space-9)",
        10: "var(--space-10)",
        11: "var(--space-11)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        hover: "var(--shadow-hover)",
        modal: "var(--shadow-modal)",
        "gold-glow": "var(--shadow-gold-glow)",
      },
      transitionTimingFunction: { luxury: "var(--ease-luxury)" },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
        cinematic: "var(--duration-cinematic)",
      },
    },
  },
  plugins: [],
};

export default config;
