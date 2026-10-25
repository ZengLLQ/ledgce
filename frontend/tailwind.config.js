/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ledgce: {
          bg: "#000000",
          surface: "#121212",
          "surface-2": "#181818",
          "surface-elevated": "#1F1F1F",
          border: "rgba(255, 255, 255, 0.12)",
          "border-subtle": "rgba(255, 255, 255, 0.06)",
          "border-active": "rgba(255, 255, 255, 0.4)",
          text: {
            primary: "#FAFAFA",
            secondary: "rgba(250, 250, 250, 0.7)",
            muted: "rgba(250, 250, 250, 0.45)",
          },
          accent: {
            DEFAULT: "#FFFFFF",
            secondary: "#FAFAFA",
            glow: "rgba(255, 255, 255, 0.35)",
            blue: "#3874FF",
          },
          state: {
            positive: "#00D26A",
            "positive-bg": "rgba(0, 210, 106, 0.12)",
            warning: "#FFAA00",
            "warning-bg": "rgba(255, 170, 0, 0.12)",
            error: "#FF453A",
            "error-bg": "rgba(255, 69, 58, 0.12)",
            info: "#FFFFFF",
            "info-bg": "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        display: [
          '"Space Grotesk"',
          'Inter',
          '-apple-system',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      letterSpacing: {
        starlink: '0.15em',
        technical: '0.25em',
        ultrawide: '0.35em',
      },
      borderRadius: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "4px",
        md: "8px",
        lg: "12px",
        xl: "14px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 0 0 1px rgba(255, 255, 255, 0.08)",
        "card-hover": "0 0 0 1px rgba(255, 255, 255, 0.25), 0 8px 30px rgba(0, 0, 0, 0.8)",
        modal: "0 24px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.15)",
        "starlink-white": "0 0 25px rgba(255, 255, 255, 0.2)",
      },
    },
  },
  plugins: [],
}
