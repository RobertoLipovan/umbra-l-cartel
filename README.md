# UMBRA-L — Casa Techno 3.0

Cartel/lineup en vivo para la fiesta UMBRA-L, construido con [Vite](https://vite.dev/) (vanilla JS, sin framework).

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo con HMR
npm run build    # build de producción a dist/
npm run preview  # sirve el build de producción
```

## Estructura

- `src/djs.js` — datos de los DJs (nombre, géneros, BPM, hora de llegada)
- `src/schedule.js` — construye el horario (sets consecutivos, sin huecos, desde una hora de inicio fija)
- `src/format.js` — helpers de formato (hora, duración, BPM, horas totales) en zona horaria Europe/Madrid
- `src/main.js` — renderizado de la página
- `src/style.css` — estilos (paleta negro + verde ácido, tipografía Orbitron/Oswald)

## Despliegue

El servidor de desarrollo corre siempre dentro de una sesión `tmux` llamada `umbral`, y se publica con Tailscale (`tailscale funnel`) bajo la ruta `/umbral3`. `vite.config.js` fija `base: '/umbral3/'` y `server.host: true` para esto.

Ver [AGENTS.md](./AGENTS.md) para más contexto de cómo mantener este proyecto.
