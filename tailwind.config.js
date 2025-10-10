/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        cyan: {
          500: '#00d9ff',
          600: '#00c4e6',
        },
        orange: {
          500: '#ff6b35',
          600: '#ff5722',
        },
        emerald: {
          500: '#10b981',
          600: '#059669',
        },
        teal: {
          500: '#14B8A6',
          600: '#0D9488',
        },
        gray: {
          50: '#ffffff',
          100: '#a0a0a0',
          200: '#999999',
          300: '#666666',
          400: '#252525',
          500: '#1a1a1a',
          600: '#141414',
          700: '#0a0a0a',
          900: '#000000',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}