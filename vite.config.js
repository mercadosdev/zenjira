import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Usar caminho relativo resolve 99% dos problemas com subpastas no Github Pages
  base: './', 
  
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: 'index.html', // Redireciona para o app caso o SW se perca
      },
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Zenjira | IGS Kanban',
        short_name: 'Zenjira',
        description: 'Plataforma Kanban e Gestão de Demandas IGS',
        theme_color: '#0f172a', 
        background_color: '#0f172a',
        display: 'standalone',
        scope: './',      // Escopo relativo
        start_url: './',  // URL de início relativa
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
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})