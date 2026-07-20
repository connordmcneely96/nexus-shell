import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "var(--nx-surface-base)",
          raised: "var(--nx-surface-raised)",
          overlay: "var(--nx-surface-overlay)",
        },
        border: {
          subtle: "var(--nx-border-subtle)",
          strong: "var(--nx-border-strong)",
        },
        text: {
          primary: "var(--nx-text-primary)",
          muted: "var(--nx-text-muted)",
          faint: "var(--nx-text-faint)",
        },
        accent: {
          DEFAULT: "var(--nx-accent)",
          dim: "var(--nx-accent-dim)",
        },
        success: "var(--nx-success)",
        verdict: "var(--nx-verdict)",
        warn: "var(--nx-warn)",
        danger: "var(--nx-danger)",
        pending: "var(--nx-pending)",
      },
      spacing: {
        1: "var(--nx-space-1)",
        2: "var(--nx-space-2)",
        3: "var(--nx-space-3)",
        4: "var(--nx-space-4)",
        5: "var(--nx-space-5)",
        6: "var(--nx-space-6)",
        8: "var(--nx-space-8)",
        10: "var(--nx-space-10)",
        12: "var(--nx-space-12)",
        16: "var(--nx-space-16)",
      },
      borderRadius: {
        xs: "var(--nx-radius-xs)",
        sm: "var(--nx-radius-sm)",
        md: "var(--nx-radius-md)",
        lg: "var(--nx-radius-lg)",
        xl: "var(--nx-radius-xl)",
        full: "var(--nx-radius-full)",
      },
      fontFamily: {
        sans: "var(--nx-font-sans)",
        mono: "var(--nx-font-mono)",
      },
      fontSize: {
        xs: "var(--nx-text-xs)",
        sm: "var(--nx-text-sm)",
        base: "var(--nx-text-base)",
        lg: "var(--nx-text-lg)",
        xl: "var(--nx-text-xl)",
        "2xl": "var(--nx-text-2xl)",
      },
    },
  },
  plugins: [],
};

export default config;
