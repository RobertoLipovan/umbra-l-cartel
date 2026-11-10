import { defineConfig } from 'vite'

// SPA de una sola página: /interior y /exterior ya no son rutas reales, solo
// existen como estado interno de src/router.js. Si alguien entra a esas URLs
// directamente (marcador, enlace viejo de cuando sí eran páginas reales), se
// redirige a la raíz. En el servidor de desarrollo lo hace este middleware;
// en producción (nginx, ver ~/services/umbral-web/nginx.conf) lo hacen dos
// reglas `location = /interior` / `location = /exterior`. Las dos cosas tienen
// que estar, o una de las dos rutas deja de redirigir según el entorno.
function redirectOldRoutes() {
  const oldPaths = new Set(['/interior', '/exterior'])

  const middleware = (req, res, next) => {
    const path = req.url.split('?')[0].replace(/\/$/, '')
    if (oldPaths.has(path)) {
      res.writeHead(302, { Location: '/' })
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
  // La app se sirve en la raíz del subdominio (https://umbral.rlip.dev/), no
  // bajo una subruta. Si algún día vuelve al Funnel de Tailscale bajo
  // /umbral3, hay que cambiar esto a '/umbral3/' y recompilar.
  base: '/',
  plugins: [redirectOldRoutes()],
  server: {
    host: true, // escucha en todas las interfaces, incluida la de Tailscale
    port: 5173,
    strictPort: true,
    allowedHosts: ['server.tail23ecc8.ts.net', 'umbral.rlip.dev'],
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: ['server.tail23ecc8.ts.net', 'umbral.rlip.dev'],
  },
})
