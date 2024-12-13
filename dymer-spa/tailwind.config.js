const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
export default {
  content: ["index.html", "./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        success: colors.emerald[500],
        warning: colors.amber[500],
        danger: colors.rose[500],
      }
    },
  },
  plugins: [],
}

