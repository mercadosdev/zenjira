/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        igs: {
          dark: '#020617', 
          /* Ao invés de um HEX fixo, ele lê a variável CSS do index.css, suportando opacidade! */
          primary: 'rgb(var(--color-primary) / <alpha-value>)',
          accent: 'rgb(var(--color-accent) / <alpha-value>)',
          bg: '#ffffff', 
          panel: '#1e293b', 
          panelDark: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}