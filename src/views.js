import { djs, EVENT, STAGES, getStage } from './djs.js'
import { buildSchedule, resolveTime } from './schedule.js'
import { RETICLE_ICON, renderBilling, renderLineup, renderHoursLine } from './render.js'

// Nombres del cartel de cabecera: una vez cada uno, en el orden en que salen
// (exterior y luego interior). 'TBA' no es un artista, es un hueco por
// anunciar, así que no se pinta como nombre.
const PLACEHOLDER_NAMES = new Set(['TBA'])

function billingNames() {
  const seen = new Set()
  const names = []
  for (const dj of djs) {
    if (PLACEHOLDER_NAMES.has(dj.name) || seen.has(dj.name)) continue
    seen.add(dj.name)
    names.push(dj.name)
  }
  return names
}

const FOOTER = `
  <footer class="cartel__footer">
    ✕ Desert Music Unity ✕
    <!-- botón "Imprimir cartel" desactivado por ahora, ver src/print.js -->
  </footer>
`

// Una sola página (landing): los dos escenarios van uno debajo del otro, sin
// navegación anidada ni vistas. Los enlaces de la cabecera son anclas
// normales (`#exterior`, `#interior`), con el scroll suave de `html`.
function renderStageSection(stageId) {
  const stage = getStage(stageId)
  const schedule = buildSchedule(stage.sets, EVENT)

  // Cierre con hora de fin abierta (secret line up): se resuelve igual que los
  // sets, pero solo se usa la hora de inicio.
  const closing = (stage.closing || []).map((slot) => ({
    ...slot,
    start: resolveTime(slot.start, EVENT),
  }))

  return `
    <section class="stage" id="${stage.id}">
      <header class="stage__header">
        <h2 class="cartel__stage" data-stage="${stage.id}">${stage.label}</h2>
        <p class="stage__hint">${stage.hint}</p>
        ${renderHoursLine(schedule)}
      </header>

      ${renderLineup(schedule, { id: `lineup-${stage.id}`, closing })}
    </section>
  `
}

export function renderLanding() {
  return `
    <main class="cartel">
      <header class="cartel__header">
        ${RETICLE_ICON}
        <p class="cartel__kicker">${EVENT.edition}</p>
        <h1 class="cartel__title">${EVENT.name}</h1>

        ${renderBilling(billingNames())}

        <nav class="stage-nav">
          ${STAGES.map(
            (stage) => `
              <a class="stage-nav__link" href="#${stage.id}">
                ${stage.id === 'exterior' ? 'Exterior' : 'Interior'}
                <span class="stage-nav__hint">${stage.hint}</span>
              </a>
            `,
          ).join('')}
        </nav>
      </header>

      ${STAGES.map((stage) => renderStageSection(stage.id)).join('')}

      ${FOOTER}
    </main>
  `
}
