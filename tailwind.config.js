/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0c0c0e",
        "bg-soft": "#121215",
        "bg-elev": "#1a1a1f",
        fg: "#ececec",
        "fg-dim": "#a0a0a8",
        "fg-soft": "#6e6e78",
        line: "rgba(255,255,255,0.08)",
        "line-strong": "rgba(255,255,255,0.14)",
        accent: "#fff65f",
        "accent-2": "#ff6b4a",
        "accent-3": "#5f9bff",
      },
      fontFamily: {
        display: [
          '"Space Grotesk"',
          "Inter",
          '"Helvetica Neue"',
          '"PingFang SC"',
          '"Microsoft Yahei"',
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "Inter",
          '"Helvetica Neue"',
          '"PingFang SC"',
          '"Microsoft Yahei"',
          "system-ui",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        serif: ['"Times New Roman"', "serif"],
      },
      maxWidth: {
        container: "1200px",
      },
      borderRadius: {
        "4xl": "18px",
      },
      letterSpacing: {
        hero: "-0.04em",
        title: "-0.03em",
        subhead: "-0.02em",
      },
      animation: {
        "scroll-line": "scrollLine 1.6s ease-in-out infinite",
      },
      keyframes: {
        scrollLine: {
          "0%, 100%": { opacity: "0.2", transform: "scaleY(0.6)" },
          "50%": { opacity: "1", transform: "scaleY(1.2)" },
        },
      },
      transitionTimingFunction: {
        "bounce-out": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
