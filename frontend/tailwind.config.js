/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        starlink: {
          bg: "#080A0E",
          dusk: "#3A2A25",
          twilight: "#1C2230",
          charcoal: "#0E1117",
          slate: "#151922",
          surface: "rgba(20, 25, 34, 0.72)",
          "surface-hover": "rgba(28, 35, 48, 0.8)",
          card: "rgba(18, 22, 30, 0.75)",
          input: "rgba(11, 14, 20, 0.85)",
          border: "rgba(255, 255, 255, 0.12)",
          "border-subtle": "rgba(255, 255, 255, 0.08)",
          "border-bright": "rgba(255, 255, 255, 0.35)",
          text: "#FFFFFF",
          "text-muted": "#9DA4B0",
          "text-dim": "#656B77",
          accent: "#FFFFFF",
        },
        ledgce: {
          bg: "#080A0E",
          surface: "#11141B",
          "surface-2": "#161A23",
          "surface-elevated": "#1D222E",
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
        neodin: [
          '"NeoDIN"',
          '"Barlow Semi Condensed"',
          '"Barlow Condensed"',
          '"D-DIN"',
          '"DIN Alternate"',
          '-apple-system',
          'sans-serif',
        ],
        sans: [
          '"NeoDIN"',
          '"Barlow Semi Condensed"',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        display: [
          '"NeoDIN"',
          '"Barlow Semi Condensed"',
          '"Space Grotesk"',
          'Inter',
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
      fontSize: {
        // Starlink NeoDIN Type Scale (pt / px calibrated)
        'din-hero': ['4rem', { lineHeight: '1.02', letterSpacing: '-0.025em', fontWeight: '700' }], // 64px / 48pt
        'din-h1': ['3rem', { lineHeight: '1.08', letterSpacing: '-0.02em', fontWeight: '700' }],    // 48px / 36pt
        'din-h2': ['2.25rem', { lineHeight: '1.14', letterSpacing: '-0.015em', fontWeight: '700' }],// 36px / 27pt
        'din-h3': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '700' }],  // 24px / 18pt
        'din-title': ['1.125rem', { lineHeight: '1.3', letterSpacing: '0em', fontWeight: '600' }],  // 18px / 13.5pt
        'din-body-lg': ['1.0625rem', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '400' }], // 17px / 13pt
        'din-body': ['0.9375rem', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '400' }],    // 15px / 11pt
        'din-caption': ['0.8125rem', { lineHeight: '1.4', letterSpacing: '0.015em', fontWeight: '400' }], // 13px / 10pt
        'din-micro': ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.18em', fontWeight: '700' }],  // 11px / 8pt uppercase
        'din-price': ['3.25rem', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '700' }],   // 52px / 39pt
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
