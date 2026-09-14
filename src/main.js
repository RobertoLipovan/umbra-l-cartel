import './style.css'
import { djs } from './djs.js'
import { RETICLE_ICON, uniqueGenres, renderGenres } from './render.js'
import { PRINT_BUTTON, setupPrintButton } from './print.js'
import { startGenreDance } from './genre-dance.js'

const genres = uniqueGenres(djs)

document.querySelector('#app').innerHTML = `
  <main class="cartel">
    <header class="cartel__header">
      ${RETICLE_ICON}
      <p class="cartel__kicker">Casa Techno 3.0</p>
      <h1 class="cartel__title">UMBRA-L</h1>

      ${renderGenres(genres)}

      <nav class="stage-nav no-print">
        <a class="stage-nav__link" href="exterior">
          Exterior
          <span class="stage-nav__hint">16:00 — 00:00 sáb</span>
        </a>
        <a class="stage-nav__link" href="interior">
          Interior
          <span class="stage-nav__hint">22:00 — 05:00</span>
        </a>
      </nav>
    </header>

    <footer class="cartel__footer">
      ✕ Desert Music Unity ✕
      <br />
      ${PRINT_BUTTON}
    </footer>
  </main>
`

setupPrintButton()
startGenreDance()
