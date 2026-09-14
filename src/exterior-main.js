import './style.css'
import { djs } from './djs.js'
import { buildSchedule } from './schedule.js'
import { RETICLE_ICON, uniqueGenres, renderGenres, renderLineup, renderHoursLine } from './render.js'
import { PRINT_BUTTON, setupPrintButton } from './print.js'
import { startGenreDance } from './genre-dance.js'
import { startCursorTilt } from './tilt.js'

const exteriorDjs = djs.filter((dj) => dj.stage === 'exterior')
const schedule = buildSchedule(exteriorDjs, { eventStart: '2026-10-03T14:00:00.000Z' }) // 16:00 Madrid, sábado
const genres = uniqueGenres(exteriorDjs)

document.querySelector('#app').innerHTML = `
  <main class="cartel">
    <header class="cartel__header">
      ${RETICLE_ICON}
      <p class="cartel__kicker">Casa Techno 3.0</p>
      <h1 class="cartel__title">UMBRA-L</h1>
      <p class="cartel__stage">Escenario exterior</p>

      ${renderHoursLine(schedule)}
      ${renderGenres(genres)}

      <a class="cartel__scroll no-print" href="#lineup">
        CARTEL
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 7L10 13L16 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </a>
    </header>

    ${renderLineup(schedule, { id: 'lineup' })}

    <nav class="stage-nav stage-nav--footer no-print">
      <a class="stage-nav__link" href=".">Portada</a>
      <a class="stage-nav__link" href="interior">Interior</a>
    </nav>

    <footer class="cartel__footer">
      ✕ Desert Music Unity ✕
      <br />
      ${PRINT_BUTTON}
    </footer>
  </main>
`

setupPrintButton()
startGenreDance()
startCursorTilt()
