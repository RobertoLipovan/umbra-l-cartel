import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// Permite entrar a /interior y /exterior sin extensión .html, tanto en el
// servidor de desarrollo como sirviendo el build (vite preview).
function cleanUrls() {
  const routes = {
    '/umbral3/interior': '/umbral3/interior.html',
    '/umbral3/exterior': '/umbral3/exterior.html',
  }

  const middleware = (req, res, next) => {
    const path = req.url.split('?')[0].replace(/\/$/, '')
    const target = routes[path]
    if (target) req.url = target
    next()
  }

  return {
    name: 'clean-urls',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig({
  base: '/umbral3/',
  plugins: [cleanUrls()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        interior: resolve(import.meta.dirname, 'interior.html'),
        exterior: resolve(import.meta.dirname, 'exterior.html'),
      },
    },
  },
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
