/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          400: "rgb(96 165 250)",
          600: "rgb(37 99 235)",
        },
        green: {
          50: "rgb(240 253 244)",
          200: "rgb(187 247 208)",
          300: "rgb(134 239 172)",
          500: "rgb(34 197 94)",
          600: "rgb(22 163 74)",
          700: "rgb(21 128 61)",
          800: "rgb(22 101 52)",
          900: "rgb(20 83 45)",
        },
        red: {
          100: "rgb(254 226 226)",
          200: "rgb(254 202 202)",
          400: "rgb(248 113 113)",
          700: "rgb(185 28 28)",
          900: "rgb(127 29 29)",
        },
        gray: {
          200: "rgb(229 231 235)",
          300: "rgb(209 213 219)",
          400: "rgb(156 163 175)",
          500: "rgb(107 114 128)",
          600: "rgb(75 85 99)",
          700: "rgb(55 65 81)",
          800: "rgb(31 41 55)",
          900: "rgb(17 24 39)",
        },
      },
    },
  },
  plugins: [],
}