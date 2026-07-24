import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./modules/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        black: { 950: "var(--color-black-950)", 900: "var(--color-black-900)" },
        charcoal: { 800: "var(--color-charcoal-800)" },
        ivory: { 100: "var(--color-ivory-100)", 50: "var(--color-ivory-50)" },
        gold: { 500: "var(--color-gold-500)", 600: "var(--color-gold-600)", 100: "var(--color-gold-100)" },
        gray: { 700: "var(--color-gray-700)", 500: "var(--color-gray-500)", 300: "var(--color-gray-300)", 100: "var(--color-gray-100)" },
        success: "var(--color-success)", error: "var(--color-error)", warning: "var(--color-warning)", info: "var(--color-info)",
      },
      fontFamily: { display: ["var(--font-display)"], body: ["var(--font-body)"] },
      fontSize: {
        hero: ["var(--text-hero)", { lineHeight: "1.1" }], h1: ["var(--text-h1)", { lineHeight: "1.15" }],
        h2: ["var(--text-h2)", { lineHeight: "1.25" }], h3: ["var(--text-h3)", { lineHeight: "1.3" }],
        "body-lg": ["var(--text-body-lg)", { lineHeight: "1.6" }], body: ["var(--text-body)", { lineHeight: "1.6" }],
        caption: ["var(--text-caption)", { lineHeight: "1.5" }], micro: ["var(--text-micro)", { lineHeight: "1.4", letterSpacing: "0.02em" }],
      },
      spacing: { 1:"var(--space-1)",2:"var(--space-2)",3:"var(--space-3)",4:"var(--space-4)",5:"var(--space-5)",6:"var(--space-6)",7:"var(--space-7)",8:"var(--space-8)",9:"var(--space-9)",10:"var(--space-10)",11:"var(--space-11)" },
      borderRadius: { sm:"var(--radius-sm)",md:"var(--radius-md)",lg:"var(--radius-lg)",xl:"var(--radius-xl)",full:"var(--radius-full)" },
      boxShadow: { card:"var(--shadow-card)",hover:"var(--shadow-hover)",modal:"var(--shadow-modal)","gold-glow":"var(--shadow-gold-glow)" },
      transitionTimingFunction: { luxury:"var(--ease-luxury)" },
      transitionDuration: { fast:"var(--duration-fast)",base:"var(--duration-base)",slow:"var(--duration-slow)",cinematic:"var(--duration-cinematic)" },
    },
  },
  plugins: [],
};
export default config;
