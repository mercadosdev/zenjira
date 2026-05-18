import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // MANTENHA A SUA BASE AQUI PARA O GITHUB PAGES CONTINUAR FUNCIONANDO
  base: '/zenjira/', 
  
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Atualiza o app automaticamente quando houver nova versão
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'], // Arquivos extras na pasta public
      manifest: {
        name: 'Zenjira',
        short_name: 'Zenjira',
        description: 'Plataforma Kanban e Gestão de Demandas IGS',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone', // Faz o app abrir sem a barra de URL do navegador
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Recomendado para Android/iOS arredondarem o ícone
          }
        ]
      }
    })
  ],
})