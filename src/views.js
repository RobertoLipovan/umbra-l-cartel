import { djs, EVENT, getStage } from './djs.js'
import { buildSchedule, resolveTime } from './schedule.js'
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
  const [first, second] = getStages()
  return `
    <main class="cartel">
      <header class="cartel__header">
        ${RETICLE_ICON}
        <p class="cartel__kicker">${EVENT.edition}</p>
        <h1 class="cartel__title">${EVENT.name}</h1>

        ${renderGenres(genres)}

        <nav class="stage-nav no-print">
          <a class="stage-nav__link" data-view="${first.id}" href="${first.id}">
            ${first.nav}
            <span class="stage-nav__hint">${first.hint}</span>
          </a>
          <a class="stage-nav__link" data-view="${second.id}" href="${second.id}">
            ${second.nav}
            <span class="stage-nav__hint">${second.hint}</span>
          </a>
        </nav>
      </header>

      ${FOOTER}
    </main>
  `
}

function getStages() {
  const exterior = getStage('exterior')
  const interior = getStage('interior')
  return [
    { id: exterior.id, nav: 'Exterior', hint: exterior.hint },
    { id: interior.id, nav: 'Interior', hint: interior.hint },
  ]
}

function renderStage(stageId, { otherStage }) {
  const stage = getStage(stageId)
  const schedule = buildSchedule(stage.sets, EVENT)
  const genres = uniqueGenres(djs.filter((dj) => dj.stage === stageId))

  // Cierre con hora de fin abierta (secret line up): se resuelve igual que los
  // sets, pero solo se usa la hora de inicio.
  const closing = (stage.closing || []).map((slot) => ({
    ...slot,
    start: resolveTime(slot.start, EVENT),
  }))

  return `
    <main class="cartel">
      <header class="cartel__header">
        ${LOGO_LINK}
        <p class="cartel__kicker">${EVENT.edition}</p>
        <h1 class="cartel__title">${EVENT.name}</h1>
        <p class="cartel__stage">${stage.label}</p>

        ${renderHoursLine(schedule)}
        ${renderGenres(genres)}

        ${SCROLL_HINT}
      </header>

      ${renderLineup(schedule, { id: 'lineup', closing })}

      <nav class="stage-nav stage-nav--footer no-print">
        <a class="stage-nav__link" data-view="home" href=".">Portada</a>
        <a class="stage-nav__link" data-view="${otherStage}" href="${otherStage}">${otherStage === 'interior' ? 'Interior' : 'Exterior'}</a>
      </nav>

      ${FOOTER}
    </main>
  `
}

// `isHome` activa el modo "sin scroll" de la portada (ver router.js/style.css).
// No hay rutas reales: la URL nunca cambia, solo el contenido de #app.
export const VIEWS = {
  home: { render: renderHome, isHome: true },
  exterior: { render: () => renderStage('exterior', { otherStage: 'interior' }), isHome: false },
  interior: { render: () => renderStage('interior', { otherStage: 'exterior' }), isHome: false },
}
