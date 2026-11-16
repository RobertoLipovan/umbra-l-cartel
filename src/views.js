import { djs, EVENT, STAGES, getStage } from './djs.js'
import { buildSchedule, resolveTime } from './schedule.js'
import { renderBilling, renderLineup, renderHoursLine } from './render.js'

// Nombres del cartel de cabecera: una vez cada uno, en el orden en que salen
// (exterior y luego interior). Ni 'TBA' ni 'Sorpresa' son artistas: son
// huecos por anunciar, así que no se pintan como nombre grande arriba
// (en el lineup sí aparecen, atenuados, para que se vea el hueco).
const PLACEHOLDER_NAMES = new Set(['TBA', 'Sorpresa'])

function billingArtistas() {
  const vistos = new Set()
  const artistas = []
  for (const dj of djs) {
    if (PLACEHOLDER_NAMES.has(dj.name) || vistos.has(dj.name)) continue
    vistos.add(dj.name)
    artistas.push({ name: dj.name, instagram: dj.instagram })
  }
  return artistas
}

const FOOTER = `
  <footer class="cartel__footer">
    <!-- Aquí iba "✕ Desert Music Unity ✕", retirado a petición (nov 2026). -->
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
  // El cierre puede tener hora de fin (`end`) o quedarse abierto ("→").
  // Ojo: si el cierre empieza de madrugada y acaba a media tarde, la regla de
  // `nextDayBefore` resuelve el fin como del día del evento y sale negativo
  // (-20h). Se corrige sumando un día cuando el fin cae antes del inicio.
  const closing = (stage.closing || []).map((slot) => {
    const start = resolveTime(slot.start, EVENT)
    let end
    if (slot.end) {
      end = resolveTime(slot.end, EVENT)
      if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000)
    }
    return { ...slot, start, ...(end ? { end } : {}) }
  })

  return `
    <section class="stage" id="${stage.id}">
      <header class="stage__header">
        <h2 class="cartel__stage">${stage.label}</h2>
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
        <p class="cartel__kicker">${EVENT.name}</p>
        <h1 class="cartel__title">${EVENT.edition}</h1>

        ${renderBilling(billingArtistas())}
      </header>

      <div class="stages">
        ${STAGES.map((stage) => renderStageSection(stage.id)).join('')}
      </div>

      ${FOOTER}
    </main>
  `
}
