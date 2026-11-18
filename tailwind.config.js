/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        thunder: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          spark: '#eab308', // electric lightning yellow
          glow: '#10b981',  // electric green glow
        }
      },
      animation: {
        'thunder-pulse': 'thunderSpark 2.5s infinite',
        'electric-flow': 'flowRight 1.5s linear infinite',
      },
    },
  },
  plugins: [],
}
