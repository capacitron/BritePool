/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'earth-brown': {
          DEFAULT: '#8B6F47',
          dark: '#6B5638',
          light: '#A89077',
        },
        'sage': {
          DEFAULT: '#87A878',
          dark: '#6B8A5F',
        },
        'terracotta': '#D4725C',
        'sky-soft': '#B8D4E8',
        'stone-warm': '#E8E3DA',
        'stone': '#C7C2B8',
        'earth-dark': '#3A3428',
        'earth-light': '#F5F2ED',
      },
      fontFamily: {
        serif: ['Spectral', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
