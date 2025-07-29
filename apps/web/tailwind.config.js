/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "curious-cyan": {
          50: "#f1f9fe",
          100: "#e3f1fb",
          200: "#c0e3f7",
          300: "#88cdf1",
          400: "#48b4e8",
          500: "#24a1de",
          600: "#137cb6",
          700: "#106394",
          800: "#12547a",
          900: "#144766",
          950: "#0d2d44",
        },
        // Tron-inspired color palette
        "tron": {
          "cyan": {
            50: "#ecfeff",
            100: "#cffafe", 
            200: "#a5f3fc",
            300: "#67e8f9",
            400: "#22d3ee",
            500: "#06b6d4",
            600: "#0891b2",
            700: "#0e7490",
            800: "#155e75",
            900: "#164e63",
            950: "#083344",
          },
          "orange": {
            50: "#fff7ed",
            100: "#ffedd5",
            200: "#fed7aa", 
            300: "#fdba74",
            400: "#fb923c",
            500: "#f97316",
            600: "#ea580c",
            700: "#c2410c",
            800: "#9a3412",
            900: "#7c2d12",
            950: "#431407",
          },
          "slate": {
            50: "#f8fafc",
            100: "#f1f5f9",
            200: "#e2e8f0",
            300: "#cbd5e1", 
            400: "#94a3b8",
            500: "#64748b",
            600: "#475569",
            700: "#334155",
            800: "#1e293b",
            900: "#0f172a",
            950: "#020617",
          }
        }
      },
      fontFamily: {
        bitcount: ["Audiowide", "monospace"],
      },
      keyframes: {
        shine: {
          "0%": { "background-position": "100%" },
          "100%": { "background-position": "-100%" },
        },
        glitch: {
          "0%": { "clip-path": "inset(20% 0 50% 0)" },
          "5%": { "clip-path": "inset(10% 0 60% 0)" },
          "10%": { "clip-path": "inset(15% 0 55% 0)" },
          "15%": { "clip-path": "inset(25% 0 35% 0)" },
          "20%": { "clip-path": "inset(30% 0 40% 0)" },
          "25%": { "clip-path": "inset(40% 0 20% 0)" },
          "30%": { "clip-path": "inset(10% 0 60% 0)" },
          "35%": { "clip-path": "inset(15% 0 55% 0)" },
          "40%": { "clip-path": "inset(25% 0 35% 0)" },
          "45%": { "clip-path": "inset(30% 0 40% 0)" },
          "50%": { "clip-path": "inset(20% 0 50% 0)" },
          "55%": { "clip-path": "inset(10% 0 60% 0)" },
          "60%": { "clip-path": "inset(15% 0 55% 0)" },
          "65%": { "clip-path": "inset(25% 0 35% 0)" },
          "70%": { "clip-path": "inset(30% 0 40% 0)" },
          "75%": { "clip-path": "inset(40% 0 20% 0)" },
          "80%": { "clip-path": "inset(20% 0 50% 0)" },
          "85%": { "clip-path": "inset(10% 0 60% 0)" },
          "90%": { "clip-path": "inset(15% 0 55% 0)" },
          "95%": { "clip-path": "inset(25% 0 35% 0)" },
          "100%": { "clip-path": "inset(30% 0 40% 0)" },
        },
        // Tron-inspired animations
        "tron-pulse": {
          "0%, 100%": { 
            opacity: "1",
            boxShadow: "0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor"
          },
          "50%": { 
            opacity: "0.8",
            boxShadow: "0 0 2px currentColor, 0 0 5px currentColor, 0 0 8px currentColor"
          },
        },
        "tron-scan": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "tron-grid": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "20px 20px" },
        },
        "circuit-flow": {
          "0%": { 
            backgroundPosition: "0% 50%",
            opacity: "0.3"
          },
          "50%": { 
            backgroundPosition: "100% 50%",
            opacity: "0.8"
          },
          "100%": { 
            backgroundPosition: "0% 50%",
            opacity: "0.3"
          },
        },
        "data-stream": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(-100%)", opacity: "0" },
        },
        "scroll-left": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      animation: {
        gradient: "gradient 8s linear infinite",
        shine: "shine 5s linear infinite",
        "glitch-after":
          "glitch var(--after-duration) infinite linear alternate-reverse",
        "glitch-before":
          "glitch var(--before-duration) infinite linear alternate-reverse",
        shimmer: "shimmer var(--duration,2s) linear infinite",
        // Tron-inspired animations
        "tron-pulse": "tron-pulse 2s ease-in-out infinite",
        "tron-scan": "tron-scan 3s linear infinite",
        "tron-grid": "tron-grid 4s linear infinite",
        "circuit-flow": "circuit-flow 6s ease-in-out infinite",
        "data-stream": "data-stream 2s linear infinite",
        "scroll-left": "scroll-left 15s linear infinite",
      },
    },
  },
  plugins: [],
};
