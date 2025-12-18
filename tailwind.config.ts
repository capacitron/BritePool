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
        // BRITE POOL Biophilic Design System
        // Earth Tones - Primary
        'earth-brown': {
          DEFAULT: '#8B6F47',
          dark: '#6B5638',
          light: '#A89077',
        },
        // Accent Colors
        'earth-gold': {
          DEFAULT: '#C9A227',
          dark: '#A68520',
        },
        sage: {
          DEFAULT: '#87A878',
          dark: '#6B8A5F',
        },
        terracotta: '#D4725C',
        'sky-soft': '#B8D4E8',
        // Neutrals
        stone: {
          DEFAULT: '#C7C2B8',
          warm: '#E8E3DA',
        },
        earth: {
          dark: '#3A3428',
          light: '#F5F2ED',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-spectral)', 'Georgia', 'serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'warm': '0 4px 6px -1px rgba(139, 111, 71, 0.1), 0 2px 4px -1px rgba(139, 111, 71, 0.06)',
        'warm-md': '0 10px 15px -3px rgba(139, 111, 71, 0.1), 0 4px 6px -2px rgba(139, 111, 71, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
