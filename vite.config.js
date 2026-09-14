import { defineConfig } from 'vite'

export default defineConfig({
  base: '/umbral3/',
  server: {
    host: true, // escucha en todas las interfaces, incluida la de Tailscale
    port: 5173,
    strictPort: true,
    allowedHosts: ['server.tail23ecc8.ts.net'],
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: ['server.tail23ecc8.ts.net'],
  },
})
