/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Forest Wealth Design System
        cream: '#FFFBF5',
        bark: '#3D3225',
        forest: {
          50: '#F0F5F1',
          100: '#DCE8DE',
          500: '#2D5A3D',
          600: '#264D34',
          700: '#1F402B',
          800: '#183322',
          900: '#112619',
          950: '#0A1910',
        },
        sand: {
          50: '#FDFBF7',
          100: '#F7F3EB',
          200: '#EDE6D9',
          300: '#DDD3C0',
          400: '#C9BBAA',
        },
        earth: {
          500: '#8B6F47',
          600: '#725A3A',
        },
        // Legacy colors
        'earth-brown': {
          DEFAULT: '#8B6F47',
          dark: '#6B5638',
          light: '#A89077',
        },
        sage: {
          DEFAULT: '#87A878',
          dark: '#6B8A5F',
        },
        terracotta: '#D4725C',
        'sky-soft': '#B8D4E8',
        'stone-warm': '#E8E3DA',
        stone: '#C7C2B8',
        'earth-dark': '#3A3428',
        'earth-light': '#F5F2ED',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      fontFamily: {
        serif: ['Spectral', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
