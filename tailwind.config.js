/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        garamond: ['"EB Garamond"', 'Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      colors: {
        cv: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          primary: '#38bdf8',
          accent: '#6366f1',
          perfect: '#10b981',
          underfilled: '#f59e0b',
          overflow: '#ef4444'
        }
      }
    },
  },
  plugins: [],
}
