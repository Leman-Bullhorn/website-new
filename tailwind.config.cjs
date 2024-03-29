/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "leman-blue": "#4DA9DF",
      },
      fontFamily: {
        primary: ["var(--font-primary)"],
        brand: ["var(--font-brand)"],
        section: ["var(--font-section)"],
        school: ["var(--font-school)"],
        headline: ["var(--font-headline)"],
      },
    },
  },
  plugins: [require("daisyui")],

  daisyui: {
    themes: false,
  },
};
