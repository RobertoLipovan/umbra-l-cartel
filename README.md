# UMBRA-L — Casa Techno 3.0

Cartel/lineup en vivo para la fiesta UMBRA-L, construido con [Vite](https://vite.dev/) (vanilla JS, sin framework). Dos escenarios, cada uno con su propia página y horario:

- `/` — portada, enlaza a los dos escenarios
- `/exterior` — sábado 16:00–00:00
- `/interior` — sábado 22:00 en adelante

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
- `src/render.js` — piezas de HTML compartidas entre páginas (logo, géneros, lineup, horas totales)
- `src/main.js`, `src/exterior-main.js`, `src/interior-main.js` — entrada de cada página
- `src/print.js` — botón "Imprimir cartel" del pie, descarga la página como `umbral3.pdf` (`html2pdf.js`)
- `src/style.css` — estilos (paleta negro + verde ácido, tipografía Orbitron/Oswald)

## Despliegue

El servidor de desarrollo corre siempre dentro de una sesión `tmux` llamada `umbral`, y se publica con Tailscale (`tailscale funnel`) bajo la ruta `/umbral3`. `vite.config.js` fija `base: '/umbral3/'` y `server.host: true` para esto.

Ver [AGENTS.md](./AGENTS.md) para más contexto de cómo mantener este proyecto.
