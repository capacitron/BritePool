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
        'glow-forest': '0 0 20px rgba(79, 118, 88, 0.25)',
        'glow-earth': '0 0 20px rgba(226, 109, 74, 0.25)',
        'inner-warm': 'inset 0 2px 4px 0 rgba(61, 48, 40, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'botanical-drift': 'botanical-drift 20s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'botanical-drift': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
      },
      transitionTimingFunction: {
        'botanical': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      // Standardized animation duration scale
      transitionDuration: {
        '75': '75ms',    // Micro-interactions (hover states, focus rings)
        '150': '150ms',  // Quick transitions (button clicks, toggles)
        '200': '200ms',  // Standard transitions (dropdowns, tooltips)
        '300': '300ms',  // Medium transitions (modals appearing)
        '500': '500ms',  // Slow transitions (page elements fading in)
        '700': '700ms',  // Slower transitions (complex animations)
        '1000': '1000ms', // Long transitions (background effects)
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
