import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// If deploying to GitHub Pages at https://<user>.github.io/<repo>,
// set base to '/<repo>/' below. For root domains, leave as '/'.
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'],
      manifest: {
        name: 'Pocket Progress',
        short_name: 'Progress',
        description: 'One-thumb savings/progress tracker with offline support.',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
