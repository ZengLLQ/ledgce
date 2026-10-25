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
          bg: "#090B12",
          surface: "#111522",
          "surface-2": "#171C2C",
          "surface-elevated": "#20263A",
          border: "rgba(255, 255, 255, 0.09)",
          "border-subtle": "rgba(255, 255, 255, 0.05)",
          "border-active": "rgba(82, 108, 255, 0.4)",
          text: {
            primary: "#F4F6FC",
            secondary: "#9BA5BC",
            muted: "#5D6882",
          },
          accent: {
            DEFAULT: "#526CFF",
            secondary: "#7588FF",
            glow: "rgba(82, 108, 255, 0.25)",
          },
          state: {
            positive: "#35D6A0",
            "positive-bg": "rgba(53, 214, 160, 0.12)",
            warning: "#F2B85C",
            "warning-bg": "rgba(242, 184, 92, 0.12)",
            error: "#FF6B78",
            "error-bg": "rgba(255, 107, 120, 0.12)",
            info: "#526CFF",
            "info-bg": "rgba(82, 108, 255, 0.12)",
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
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      borderRadius: {
        xs: "3px",
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
        elevated: "0 10px 30px -4px rgba(0, 0, 0, 0.6)",
        accent: "0 0 25px -5px rgba(82, 108, 255, 0.35)",
        inset: "inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
      },
    },
  },
  plugins: [],
};
