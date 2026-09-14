# UMBRA-L — Casa Techno 3.0

Cartel/lineup en vivo para la fiesta UMBRA-L, construido con [Vite](https://vite.dev/) (vanilla JS, sin framework). SPA de una sola página con tres vistas — portada, escenario exterior, escenario interior — con transición animada entre ellas. `/exterior` e `/interior` no son rutas reales del servidor (son solo estado del router reflejado en la URL); entrar ahí directamente redirige a `/`.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo con HMR
npm run build    # build de producción a dist/
npm run preview  # sirve el build de producción
```

## Estructura

- `src/djs.js` — datos de los DJs (nombre, géneros, BPM, escenario, hora de llegada de referencia); el orden en el array es el orden de actuación
- `src/schedule.js` — construye el horario de un escenario (sets consecutivos, sin huecos, desde una hora de inicio dada)
- `src/format.js` — helpers de formato (hora, duración, BPM, horas totales) en zona horaria Europe/Madrid
- `src/render.js` — piezas de HTML compartidas entre vistas (logo, géneros, lineup, horas totales)
- `src/views.js` — las tres vistas (portada, exterior, interior), cada una una función que devuelve el HTML de `.cartel`
- `src/router.js` — monta la vista actual en `#app`, navegación vía `pushState`/`popstate`
- `src/page-transition.js` — máscara diagonal verde entre vistas, dirección aleatoria
- `src/genre-dance.js` — chips de género que cambian de estado al azar cada 500ms
- `src/tilt.js` — inclinación 3D del `body` siguiendo el cursor
- `src/print.js` — botón "Imprimir cartel" (desactivado temporalmente), descarga `.cartel` como `umbral3.pdf` (`html2canvas` + `jspdf`, página única del tamaño del contenido)
- `src/style.css` — estilos (paleta negro + verde ácido, tipografía Orbitron/Oswald)

## Despliegue

El servidor de desarrollo corre siempre dentro de una sesión `tmux` llamada `umbral`, y se publica con Tailscale (`tailscale funnel`) bajo la ruta `/umbral3`. `vite.config.js` fija `base: '/umbral3/'`, `server.host: true`, y un plugin que redirige `/interior`/`/exterior` a la raíz.

Ver [AGENTS.md](./AGENTS.md) para más contexto de cómo mantener este proyecto.
