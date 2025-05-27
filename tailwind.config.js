// tailwind.config.js
import { defineConfig } from 'tailwindcss'

export default defineConfig({
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // tu sans por defecto sigue siendo Comme
        sans: ['Comme', 'sans-serif'],
        // aquí defines Baloo 2
        baloo2: ['"Baloo 2"', 'sans-serif'],
      },
    },
  },
  plugins: [],
})