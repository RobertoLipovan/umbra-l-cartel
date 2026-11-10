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

// Orbitron no cubre ni cirílico ni la Ø/ø nórdica, así que el navegador las
// sustituye por una fuente de reserva a un tamaño distinto (p. ej. en NVЯR,
// FØBIA, FLAMENKØ). Las envolvemos para achicarlas a mano. Ojo: la ø
// minúscula (Flamenkø, Føbia) también cuenta, no solo la mayúscula.
function renderName(name) {
  return name.replace(/[ЯØø]/g, (char) => `<span class="glyph-fallback">${char}</span>`)
}

const INSTAGRAM_ICON = `
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="2" />
    <circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="2" />
    <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
  </svg>
`

function renderInstagramLink(instagram, djName, variant) {
  if (!instagram) return ''
  const handle = instagram.replace(/^@/, '')
  const className = variant ? `lineup__instagram lineup__instagram--${variant}` : 'lineup__instagram'
  return `<a class="${className}" href="https://instagram.com/${handle}" target="_blank" rel="noopener noreferrer" aria-label="Instagram de ${djName}">${INSTAGRAM_ICON}</a>`
}

// En nombres de una palabra el icono simplemente va al final. En nombres de
// dos palabras hace falta cubrir dos casos con CSS (ver .lineup__instagram--*):
// en pantallas anchas cabe todo en una línea ("ANN BLACKSMITH [icono]"), pero
// en pantallas estrechas el nombre se parte en dos líneas y, si el icono
// sigue al final, cae solo en la segunda línea. Por eso se renderizan dos
// copias del enlace (una tras la primera palabra, otra tras el nombre
// completo) y una media query en el CSS decide cuál mostrar.
function renderNameWithInstagram(name, instagram) {
  const spaceIndex = name.indexOf(' ')
  if (spaceIndex === -1) return `${renderName(name)}${renderInstagramLink(instagram, name)}`
  if (!instagram) return renderName(name)

  const first = renderName(name.slice(0, spaceIndex))
  const rest = renderName(name.slice(spaceIndex))
  const mobileLink = renderInstagramLink(instagram, name, 'mobile')
  const desktopLink = renderInstagramLink(instagram, name, 'desktop')
  return `${first}${mobileLink}${rest}${desktopLink}`
}

// Un set puede tener varios artistas (B2B): "Deif b2b Will•Y".
function renderArtists(artists) {
  return artists
    .map((artist) => renderNameWithInstagram(artist.name, artist.instagram))
    .join('<span class="lineup__b2b">b2b</span>')
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

function renderBpm(bpm) {
  if (!bpm || bpm[0] === '?') return ''
  return `<span class="lineup__bpm">${formatBpm(bpm)}</span>`
}

function renderGenresCell(genres, { tba }) {
  const visible = genres.filter((genre) => !PLACEHOLDER_GENRES.has(genre.trim().toLowerCase()))
  if (tba) return `<span class="lineup__genres lineup__genres--tba">Por anunciar</span>`
  if (!visible.length) return `<span class="lineup__genres lineup__genres--tba">Por confirmar</span>`
  return `<span class="lineup__genres">${visible.join(' · ')}</span>`
}

export function renderLineup(schedule, { id, closing = [] } = {}) {
  let currentDay = null

  const renderDayHeading = (date) => {
    const day = formatDay(date)
    if (day === currentDay) return ''
    currentDay = day
    return `<li class="lineup__day">${day}</li>`
  }

  const rows = schedule
    .map(
      (slot) => `
        ${renderDayHeading(slot.start)}
        <li class="lineup__item${slot.tba ? ' lineup__item--tba' : ''}">
          <span class="lineup__time">
            <span class="lineup__time-range">${formatTime(slot.start)}–${formatTime(slot.end)}</span>
            <span class="lineup__duration">${formatDuration(slot.start, slot.end)}</span>
          </span>
          <span class="lineup__name">${renderArtists(slot.artists)}</span>
          ${renderGenresCell(slot.genres, slot)}
          ${renderBpm(slot.bpm)}
        </li>
      `,
    )
    .join('')

  // Cierre con hora de fin abierta (secret line up, b2b hasta que paren...).
  const closingRows = closing
    .map(
      ({ start, label, note }) => `
        ${renderDayHeading(start)}
        <li class="lineup__item lineup__item--open">
          <span class="lineup__time">
            <span class="lineup__time-range">${formatTime(start)} →</span>
            <span class="lineup__duration">${note || 'Indefinido'}</span>
          </span>
          <span class="lineup__name">${renderName(label)}</span>
          <span class="lineup__genres">Hasta el cierre</span>
        </li>
      `,
    )
    .join('')

  return `<ul class="lineup"${id ? ` id="${id}"` : ''}>${rows}${closingRows}</ul>`
}

// Suma las duraciones reales de los sets en vez de restar último-fin menos
// primer-inicio: con huecos entre medias (la pausa de medianoche) esa resta
// contaba tiempo sin música.
export function renderHoursLine(schedule) {
  const totalMs = schedule.reduce((total, slot) => total + (slot.end - slot.start), 0)
  return `<p class="cartel__hours"><span class="cartel__hours-number">${formatHours(totalMs)}</span> horas de música</p>`
}
