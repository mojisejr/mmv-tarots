import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
          50: '#fff0f0',
          100: '#ffdede',
          200: '#ffc2c2',
          300: '#ffa0a0',
          400: '#ff7070',
          500: '#f27669', // Original Primary
          600: '#e04f4f',
          700: '#bd3232',
          800: '#9c2b2b',
          900: '#822828',
          950: '#471010',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          50: '#fbf8eb',
          100: '#f5eccd',
          200: '#ebd89e',
          300: '#e0c06b',
          400: '#d6a942',
          500: '#d4af37', // Muted Gold
          600: '#b58d28',
          700: '#916b22',
          800: '#765522',
          900: '#624621',
          950: '#382610',
        },
        // Semantic colors
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: {
          DEFAULT: '#e5e7eb',
          foreground: 'var(--color-muted-foreground)',
        },
        // Success color (Darker Green for Light Mode)
        success: {
          DEFAULT: 'var(--color-success)',
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          foreground: 'var(--color-warning-foreground)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          foreground: 'var(--color-info-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)',
          foreground: 'var(--color-destructive-foreground)',
        },
        // Glass effect colors (Light Mode)
        glass: {
          white: 'rgba(255, 255, 255, 0.7)',
          whiteHover: 'rgba(255, 255, 255, 0.85)',
          border: 'rgba(255, 255, 255, 0.4)',
          borderHover: 'rgba(255, 255, 255, 0.6)',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
        mono: ['Ubuntu Mono', 'JetBrains Mono', 'monospace'],
      },
      animation: {
        'float-slow': 'float-slow 15s ease-in-out infinite',
        'float-delayed': 'float-delayed 18s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 10s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'fade-in-down': 'fade-in-down 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(20px, -20px) scale(1.05)' },
        },
        'float-delayed': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.1)' },
        },
        'fade-in-up': {
          'from': { opacity: '0', transform: 'translateY(30px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          'from': { opacity: '0', transform: 'translateY(-30px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      perspective: {
        '1000': '1000px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'warm': '0 8px 24px -6px rgba(89, 46, 46, 0.15)', // Warm shadow for Morning Mystic
        'glow-primary': '0 0 20px rgba(255, 214, 209, 0.6)',
        'glow-accent': '0 0 20px rgba(212, 175, 55, 0.4)',
      },
    },
  },
  plugins: [],
} satisfies Config;
