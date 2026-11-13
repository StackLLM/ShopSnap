import lightswind from "lightswind/plugin";

/** @type {import('tailwindcss').Config} */
// Charte « luxe » de ShopSnap : noir chaud, ivoire, champagne / or.
// Les noms de couleurs suivent la convention des composants Lightswind (background, primary, muted…).
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        or: { 50: "#FBF6EC", 100: "#F3E7CF", 200: "#E8D5A8", 300: "#D9BC84", 400: "#C9A96E", 500: "#B08D4F", 600: "#8E6F3B", 700: "#6B532C" },
        succes: "hsl(var(--succes))",
        alerte: "hsl(var(--alerte))",
      },
      fontFamily: {
        sans: ['"Inter Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Cormorant Garamond"', "ui-serif", "Georgia", "serif"],
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 4px)", sm: "calc(var(--radius) - 8px)" },
      keyframes: {
        aurora: {
          from: { backgroundPosition: "50% 50%, 50% 50%" },
          to: { backgroundPosition: "350% 50%, 350% 50%" },
        },
      },
      animation: { aurora: "aurora 60s linear infinite" },
    },
  },
  // Plugin officiel Lightswind : styles des boutons / badges (version plate, sans effet 3D)
  plugins: [lightswind({ effect3d: false })],
};
