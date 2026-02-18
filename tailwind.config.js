/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,astro}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', 'monospace'],
      },
      colors: {
        // Evergreen backgrounds
        'ev-void': '#0f1612',
        'ev-primary': '#1a2520',
        'ev-secondary': '#243b2f',
        'ev-tertiary': '#2d4a3e',
        'ev-elevated': '#3a5a4d',
        // Evergreen text
        'ev-text': '#e8f4ed',
        'ev-text-secondary': '#c5d9cd',
        'ev-text-muted': '#9db5a5',
        'ev-text-inverse': '#0d1310',
        // Evergreen accents
        sprout: {
          DEFAULT: '#50c878',
          dim: 'rgba(80, 200, 120, 0.15)',
          glow: 'rgba(80, 200, 120, 0.4)',
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
        // Keep gray scale but update
        gray: {
          50: '#e8f4ed',
          100: '#c5d9cd',
          200: '#9db5a5',
          300: '#3a5a4d',
          400: '#2d4a3e',
          500: '#243b2f',
          600: '#1a2520',
          700: '#0f1612',
          900: '#0d1310',
        },
      },
      borderColor: {
        'ev-subtle': 'rgba(80, 200, 120, 0.08)',
        'ev-default': 'rgba(80, 200, 120, 0.15)',
        'ev-strong': 'rgba(80, 200, 120, 0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
