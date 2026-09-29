/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        valeon: {
          navy:    '#0A1628',
          blue:    '#1B3A6B',
          accent:  '#2563EB',
          gold:    '#D4A847',
          surface: '#111827',
          panel:   '#1F2937',
          border:  '#374151',
          muted:   '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
