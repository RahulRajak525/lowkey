/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // NativeWind defaults to "media" (system-only) and *throws* if
  // colorScheme.set()/useColorScheme().setColorScheme() is called without
  // this — required for the in-app light/dark toggle.
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F4A261",
          light: "#F4B183",
          dark: "#E76F51",
          soft: "#FFD7BA",
        },
        // Semantic surfaces/text resolve from CSS variables (global.css),
        // so they automatically track the active color scheme.
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          light: "rgb(var(--color-surface-light) / <alpha-value>)",
          dark: "rgb(var(--color-surface-dark) / <alpha-value>)",
          card: "rgb(var(--color-surface-card) / <alpha-value>)",
        },
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        "muted-foreground": "rgb(var(--color-muted-foreground) / <alpha-value>)",
        "subtle-foreground": "rgb(var(--color-subtle-foreground) / <alpha-value>)",
        // Fixed (not theme-reactive): content drawn on top of `primary`,
        // which stays the same brand orange in both color schemes, so its
        // contrasting color must stay fixed too rather than flip with them.
        "on-primary": "#14110D",
      },
      // A small bump over Tailwind's default scale, applied everywhere at
      // once rather than editing every `text-*` className individually.
      fontSize: {
        xs: ["13px", { lineHeight: "18px" }],
        sm: ["15px", { lineHeight: "22px" }],
        base: ["17px", { lineHeight: "26px" }],
        lg: ["19px", { lineHeight: "28px" }],
        xl: ["21px", { lineHeight: "28px" }],
        "2xl": ["25px", { lineHeight: "32px" }],
        "3xl": ["31px", { lineHeight: "38px" }],
      },
    },
  },
  plugins: [],
}
