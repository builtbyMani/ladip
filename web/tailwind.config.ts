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
        display: ["var(--font-outfit)", "Plus Jakarta Sans", "sans-serif"],
        sans: ["var(--font-jakarta)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      colors: {
        hormn: {
          ink: "#111827",
          slate: "#87909A",
          accent: "#4A7BB7",
          muted: "#7C93B2",
          blueCard: "#EAF2FA",
          sandCard: "#F5F2EB",
          lavenderCard: "#F0EDF8",
          mintCard: "#EAF5F0",
          surface: "#F8FAFC",
          trustGreen: "#00B67A",
        },
        clinical: {
          critical: "#DC2626",
          high: "#B48A00",
          moderate: "#4A7BB7",
          low: "#1B7A3D",
        },
      },
      boxShadow: {
        diffusion: "0 20px 40px -15px rgba(17, 24, 39, 0.05)",
        card: "0 12px 32px -12px rgba(17, 24, 39, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
