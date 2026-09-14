import { formatDay, formatTime, formatBpm, formatDuration, formatHours } from './format.js'

export const RETICLE_ICON = `
  <svg class="cartel__logo" width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="18" stroke="currentColor" stroke-width="3" stroke-dasharray="20 8" />
    <line x1="28" y1="2" x2="28" y2="14" stroke="currentColor" stroke-width="3" />
    <line x1="28" y1="42" x2="28" y2="54" stroke="currentColor" stroke-width="3" />
    <line x1="2" y1="28" x2="14" y2="28" stroke="currentColor" stroke-width="3" />
    <line x1="42" y1="28" x2="54" y2="28" stroke="currentColor" stroke-width="3" />
    <circle cx="28" cy="28" r="2.5" fill="currentColor" />
  </svg>
`

// Orbitron no cubre ni cirílico ni la Ø nórdica, así que el navegador las
// sustituye por una fuente de reserva a un tamaño distinto (p. ej. en NVЯR,
// FØBIA, FLAMENKØ). Las envolvemos para achicarlas a mano.
function renderName(name) {
  return name.replace(/[ЯØ]/g, (char) => `<span class="glyph-fallback">${char}</span>`)
}

const INSTAGRAM_ICON = `
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="2" />
    <circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="2" />
    <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
  </svg>
`

function renderInstagramLink(instagram, djName) {
  if (!instagram) return ''
  const handle = instagram.replace(/^@/, '')
  return `<a class="lineup__instagram" href="https://instagram.com/${handle}" target="_blank" rel="noopener noreferrer" aria-label="Instagram de ${djName}">${INSTAGRAM_ICON}</a>`
}

// El icono va pegado a la primera palabra del nombre (no al final del todo)
// para que, si el nombre se parte en dos líneas en pantallas estrechas
// ("ANN" / "BLACKSMITH"), se quede en la primera línea en vez de saltar
// a la segunda junto con el resto del nombre.
function renderNameWithInstagram(name, instagram) {
  const link = renderInstagramLink(instagram, name)
  if (!link) return renderName(name)
  const spaceIndex = name.indexOf(' ')
  if (spaceIndex === -1) return `${renderName(name)}${link}`
  return `${renderName(name.slice(0, spaceIndex))}${link}${renderName(name.slice(spaceIndex))}`
}

const PLACEHOLDER_GENRES = new Set(['por confirmar'])

export function uniqueGenres(djs) {
  const seen = new Set()
  const genres = []
  for (const dj of djs) {
    for (const genre of dj.genres) {
      const key = genre.trim().toLowerCase()
      if (!seen.has(key) && !PLACEHOLDER_GENRES.has(key)) {
        seen.add(key)
        genres.push(genre)
      }
    }
  }
  return genres
}

export function renderGenres(genres) {
  return `
    <section class="genres">
      <ul class="genres__list">
        ${genres.map((genre) => `<li class="genres__item">${genre}</li>`).join('')}
      </ul>
    </section>
  `
}

export function renderLineup(schedule, { id, closingSets = [] } = {}) {
  let currentDay = null
  const rows = schedule
    .map((slot) => {
      const day = formatDay(slot.start)
      const dayHeading = day !== currentDay ? `<li class="lineup__day">${day}</li>` : ''
      currentDay = day

      return `
        ${dayHeading}
        <li class="lineup__item">
          <span class="lineup__time">
            <span class="lineup__time-range">${formatTime(slot.start)}–${formatTime(slot.end)}</span>
            <span class="lineup__duration">${formatDuration(slot.start, slot.end)}</span>
          </span>
          <span class="lineup__name">${renderNameWithInstagram(slot.name, slot.instagram)}</span>
          <span class="lineup__genres">${slot.genres.join(' · ')}</span>
          <span class="lineup__bpm">${formatBpm(slot.bpm)}</span>
        </li>
      `
    })
    .join('')

  // Sesión de cierre sin hora de fin fija (b2b hasta que decidan parar).
  const closingRows = closingSets
    .map(({ start, names }) => {
      const day = formatDay(start)
      const dayHeading = day !== currentDay ? `<li class="lineup__day">${day}</li>` : ''
      currentDay = day

      return `
        ${dayHeading}
        <li class="lineup__item lineup__item--open">
          <span class="lineup__time">
            <span class="lineup__time-range">${formatTime(start)} →</span>
            <span class="lineup__duration">Indefinido</span>
          </span>
          <span class="lineup__name">${names.map(renderName).join(' · ')}</span>
          <span class="lineup__genres">B2B de cierre</span>
        </li>
      `
    })
    .join('')

  return `<ul class="lineup"${id ? ` id="${id}"` : ''}>${rows}${closingRows}</ul>`
}

export function renderHoursLine(schedule) {
  const totalMs = schedule[schedule.length - 1].end - schedule[0].start
  return `<p class="cartel__hours"><span class="cartel__hours-number">${formatHours(totalMs)}</span> horas de música ininterrumpida</p>`
}
