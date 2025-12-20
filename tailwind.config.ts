import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Forest Wealth Design System - Brite Pool Brand
        forest: {
          50: '#f3f6f4',
          100: '#e0e8e2',
          200: '#c2d1c6',
          300: '#9ab4a1',
          400: '#6f9379',
          500: '#4f7658',
          600: '#3d5e46',
          700: '#324c3a',  // Primary brand color
          800: '#2a3e30',
          900: '#243329',
          950: '#121c16',
        },
        earth: {
          50: '#fdf6f3',
          100: '#fbe9e1',
          200: '#f8d4c4',
          300: '#f2b69e',
          400: '#ea8f6f',
          500: '#e26d4a',  // Main accent
          600: '#d4523a',
          700: '#b04030',
          800: '#91372c',
          900: '#783229',
          950: '#411713',
        },
        sand: {
          50: '#fdfcf9',
          100: '#f9f5ed',
          200: '#f2e8d5',
          300: '#e8d5b5',
          400: '#dcbd8e',
          500: '#d0a46d',
          600: '#c38c56',
          700: '#a37049',
          800: '#855b40',
          900: '#6c4b37',
          950: '#3a261c',
        },
        // Utility colors
        cream: '#faf8f5',
        bark: '#3d3028',
        ivory: '#fcfbf8',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        body: ['var(--font-lora)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'warm': '0 4px 6px -1px rgba(61, 48, 40, 0.08), 0 2px 4px -1px rgba(61, 48, 40, 0.04)',
        'warm-md': '0 10px 15px -3px rgba(61, 48, 40, 0.08), 0 4px 6px -2px rgba(61, 48, 40, 0.04)',
        'warm-lg': '0 20px 25px -5px rgba(61, 48, 40, 0.10), 0 10px 10px -5px rgba(61, 48, 40, 0.04)',
        'forest': '0 4px 14px -3px rgba(50, 76, 58, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
