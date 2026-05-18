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
        // Mágica: Transforma todos os "slate" do projeto em cinzas neutros profissionais
        slate: colors.neutral, 
        igs: {
          dark: '#000000', // Preto absoluto no fundo geral
          primary: 'rgb(var(--color-primary) / <alpha-value>)',
          accent: 'rgb(var(--color-accent) / <alpha-value>)',
          bg: '#ffffff', 
          panel: '#171717', // Cinza muito escuro para os cards e painéis
          panelDark: '#0a0a0a', // Quase preto para a barra lateral
        }
      }
    },
  },
  plugins: [],
}