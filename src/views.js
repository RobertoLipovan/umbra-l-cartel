import { djs } from './djs.js'
import { buildSchedule } from './schedule.js'
import { RETICLE_ICON, uniqueGenres, renderGenres, renderLineup, renderHoursLine } from './render.js'

const SCROLL_HINT = `
  <a class="cartel__scroll no-print" href="#lineup">
    CARTEL
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 7L10 13L16 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </a>
`

const FOOTER = `
  <footer class="cartel__footer">
    ✕ Desert Music Unity ✕
    <!-- botón "Imprimir cartel" desactivado por ahora, ver src/print.js -->
  </footer>
`

// El logo de las vistas de escenario es un enlace de vuelta a la portada:
// lleva `data-view="home"`, así que lo intercepta router.js como el resto de
// la navegación (transición diagonal incluida) y la URL no cambia. En la
// portada el logo se queda decorativo, sin enlace.
const LOGO_LINK = `
  <a class="cartel__logo-link" data-view="home" href="." aria-label="Volver a la portada">
    ${RETICLE_ICON}
  </a>
`

function renderHome() {
  const genres = uniqueGenres(djs)
  return `
    <main class="cartel">
      <header class="cartel__header">
        ${RETICLE_ICON}
        <p class="cartel__kicker">Casa Techno 3.0</p>
        <h1 class="cartel__title">UMBRA-L</h1>

        ${renderGenres(genres)}

        <nav class="stage-nav no-print">
          <a class="stage-nav__link" data-view="exterior" href="exterior">
            Exterior
            <span class="stage-nav__hint">16:00 — 00:00 sáb</span>
          </a>
          <a class="stage-nav__link" data-view="interior" href="interior">
            Interior
            <span class="stage-nav__hint">22:00 — 05:00</span>
          </a>
        </nav>
      </header>

      ${FOOTER}
    </main>
  `
}

function renderExterior() {
  const exteriorDjs = djs.filter((dj) => dj.stage === 'exterior')
  const schedule = buildSchedule(exteriorDjs, { eventStart: '2026-10-03T14:00:00.000Z' }) // 16:00 Madrid, sábado
  const genres = uniqueGenres(exteriorDjs)

  return `
    <main class="cartel">
      <header class="cartel__header">
        ${LOGO_LINK}
        <p class="cartel__kicker">Casa Techno 3.0</p>
        <h1 class="cartel__title">UMBRA-L</h1>
        <p class="cartel__stage">Escenario exterior</p>

        ${renderHoursLine(schedule)}
        ${renderGenres(genres)}

        ${SCROLL_HINT}
      </header>

      ${renderLineup(schedule, { id: 'lineup' })}

      <nav class="stage-nav stage-nav--footer no-print">
        <a class="stage-nav__link" data-view="home" href=".">Portada</a>
        <a class="stage-nav__link" data-view="interior" href="interior">Interior</a>
      </nav>

      ${FOOTER}
    </main>
  `
}

function renderInterior() {
  const interiorDjs = djs.filter((dj) => dj.stage === 'interior')
  const schedule = buildSchedule(interiorDjs, { eventStart: '2026-10-03T20:00:00.000Z' }) // 22:00 Madrid, sábado
  const genres = uniqueGenres(interiorDjs)

  // Sesión b2b de cierre, sin hora de fin fija ("hasta que se cansen"),
  // justo a continuación del último set con hora fija.
  const closingSets = [
    { start: schedule[schedule.length - 1].end, names: ['Leks', 'FLAMENKØ', 'CARDAN'] },
  ]

  return `
    <main class="cartel">
      <header class="cartel__header">
        ${LOGO_LINK}
        <p class="cartel__kicker">Casa Techno 3.0</p>
        <h1 class="cartel__title">UMBRA-L</h1>
        <p class="cartel__stage">Escenario interior</p>

        ${renderHoursLine(schedule)}
        ${renderGenres(genres)}

        ${SCROLL_HINT}
      </header>

      ${renderLineup(schedule, { id: 'lineup', closingSets })}

      <nav class="stage-nav stage-nav--footer no-print">
        <a class="stage-nav__link" data-view="home" href=".">Portada</a>
        <a class="stage-nav__link" data-view="exterior" href="exterior">Exterior</a>
      </nav>

      ${FOOTER}
    </main>
  `
}

// `isHome` activa el modo "sin scroll" de la portada (ver router.js/style.css).
// No hay rutas reales: la URL nunca cambia, solo el contenido de #app.
export const VIEWS = {
  home: { render: renderHome, isHome: true },
  exterior: { render: renderExterior, isHome: false },
  interior: { render: renderInterior, isHome: false },
}
