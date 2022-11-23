/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "leman-blue": "#4DA9DF",
      },
      fontFamily: {
        headline: ["var(--font-headline)"],
        brand: ["var(--font-brand)"],
      },
    },
  },
  plugins: [require("daisyui")],

  daisyui: {
    themes: false,
  },
};
