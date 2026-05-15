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
        // Define a Roboto como fonte padrão
        sans: ['"Roboto"', 'sans-serif'],
      },
      colors: {
        igs: {
          dark: '#020617', 
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