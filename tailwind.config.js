import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Roboto"', 'sans-serif'],
      },
      colors: {
        slate: colors.slate,
        igs: {
          dark: '#0f172a', // Fundo principal: slate-900
          primary: 'rgb(var(--color-primary) / <alpha-value>)',
          accent: 'rgb(var(--color-accent) / <alpha-value>)',
          bg: '#f8fafc', // Modo claro: slate-50
          panel: '#1e293b', // Fundo de cards/modais: slate-800
          panelDark: '#020617', // Sidebar: slate-950
        }
      }
    },
  },
  plugins: [],
}