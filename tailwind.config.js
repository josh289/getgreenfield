/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,astro}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono Variable', 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', 'monospace'],
      },
      colors: {
        // Evergreen backgrounds (light mode)
        'ev-void': '#FFFFFF',
        'ev-primary': '#F8FAFC',
        'ev-secondary': '#F1F5F9',
        'ev-tertiary': '#E2E8F0',
        'ev-elevated': '#FFFFFF',
        // Evergreen text (dark on light)
        'ev-text': '#0F172A',
        'ev-text-secondary': '#475569',
        'ev-text-muted': '#64748B',
        'ev-text-inverse': '#FFFFFF',
        // Evergreen accents
        sprout: {
          DEFAULT: '#50c878',
          text: '#2E8B57',
          dim: 'rgba(80,200,120,0.08)',
          glow: 'rgba(80,200,120,0.15)',
          end: '#3da861',
        },
        gold: {
          DEFAULT: '#f4d03f',
          dim: 'rgba(244, 208, 63, 0.15)',
        },
        coral: {
          DEFAULT: '#ff6b6b',
          dim: 'rgba(255, 107, 107, 0.15)',
        },
        amber: {
          DEFAULT: '#ff9f40',
          dim: 'rgba(255, 159, 64, 0.15)',
        },
        violet: {
          DEFAULT: '#9b6dff',
          dim: 'rgba(155, 109, 255, 0.15)',
        },
        'ev-blue': {
          DEFAULT: '#6eb8e0',
          dim: 'rgba(110, 184, 224, 0.15)',
        },
        // Standard slate scale
        gray: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      borderColor: {
        'ev-subtle': '#F1F5F9',
        'ev-default': '#E2E8F0',
        'ev-strong': '#CBD5E1',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.05)',
        'md': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
        'lg': '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05)',
        'xl': '0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)',
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05)',
        'elevated': '0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)',
        'glow-sprout': 'none',
        'glow-sprout-strong': 'none',
        'glow-gold': 'none',
        'glow-coral': 'none',
        'glow-violet': 'none',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
