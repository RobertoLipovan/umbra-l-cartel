import { defineConfig } from 'vite'

// SPA de una sola página: /interior y /exterior ya no son rutas reales, solo
// existen como estado interno de src/router.js (vía pushState, para que la
// barra de direcciones se vea bien durante la sesión). Si alguien entra a
// esas URLs directamente (marcador, enlace viejo), se redirige a la raíz en
// vez de intentar servir nada ahí.
function redirectOldRoutes() {
  const oldPaths = new Set(['/umbral3/interior', '/umbral3/exterior'])

  const middleware = (req, res, next) => {
    const path = req.url.split('?')[0].replace(/\/$/, '')
    if (oldPaths.has(path)) {
      res.writeHead(302, { Location: '/umbral3/' })
      res.end()
      return
    }
    next()
  }

  return {
    name: 'redirect-old-routes',
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
  plugins: [redirectOldRoutes()],
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
