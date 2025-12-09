import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: 'var(--color-primary)',
          50: '#fef7f6',
          100: '#feeeea',
          200: '#fbd9d3',
          300: '#f6baaf',
          400: '#f18e7c',
          500: '#F27669',
          600: '#e4584a',
          700: '#c13d31',
          800: '#9f332c',
          900: '#842f2a',
          950: '#461815',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          50: '#fefaf0',
          100: '#fdf5e0',
          200: '#fbe9c2',
          300: '#f7d99a',
          400: '#f3c367',
          500: '#FCBD74',
          600: '#e9a846',
          700: '#c68d35',
          800: '#a4742f',
          900: '#88612a',
          950: '#483116',
        },
        // Semantic colors
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: {
          DEFAULT: '#71717a',
          foreground: 'var(--color-muted-foreground)',
        },
        // Success color (LINE green)
        success: {
          DEFAULT: 'var(--color-success)',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#06C755',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Glass effect colors
        glass: {
          white: 'rgba(255, 255, 255, 0.1)',
          whiteHover: 'rgba(255, 255, 255, 0.15)',
          border: 'rgba(255, 255, 255, 0.1)',
          borderHover: 'rgba(255, 255, 255, 0.2)',
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
          '0%, 100%': { opacity: '0.1', transform: 'scale(1)' },
          '50%': { opacity: '0.15', transform: 'scale(1.1)' },
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
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
        'glow-primary': '0 0 20px rgba(242, 118, 105, 0.4)',
        'glow-accent': '0 0 20px rgba(252, 189, 116, 0.4)',
      },
    },
  },
  plugins: [],
} satisfies Config;
