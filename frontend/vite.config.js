import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Lets the API run through the same origin as the frontend, so a single
    // tunnel/host works for both (no hardcoded localhost:5005 in the client).
    proxy: {
      '/api': {
        target: 'http://localhost:5005',
        changeOrigin: true,
      },
    },
    // Needed when fronted by a tunnel (e.g. Cloudflare quick tunnel) — Vite
    // rejects requests whose Host header isn't in this list otherwise.
    allowedHosts: true,
  },
})
