/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkbg: "#eaf4fc",
        cardbg: "rgba(255, 255, 255, 0.85)",
        copper: {
          400: "#f59e0b",
          500: "#d97706",
          600: "#b45309",
        },
        electric: {
          400: "#38bdf8",
          500: "#0284c7",
          glow: "#38bdf8"
        },
        plasma: {
          400: "#a855f7",
          500: "#7c3aed",
          glow: "#a855f7"
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(0, 240, 255, 0.3)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.3)',
        'glow-purple': '0 0 25px -5px rgba(168, 85, 247, 0.3)',
      }
    },
  },
  plugins: [],
}
