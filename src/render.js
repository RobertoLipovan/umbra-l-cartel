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

// Orbitron no tiene Ø ni ø (comprobado midiendo el ancho del glifo: cae a la
// fuente de reserva y se ve más pequeño y de otro estilo que el resto del
// nombre). En vez de dejar que el navegador use otra fuente, se dibuja una O
// de Orbitron y se le cruza una barra con CSS (`.o-slash::after`). Así el
// carácter es idéntico al resto de letras.
//
// El cirílico Я y el bullet • sí se dejan al fallback, achicados: son casos
// raros y no hay una forma limpia de fabricarlos.
function renderName(name) {
  return name
    .replace(/[Øø]/g, () => '<span class="o-slash">O</span>')
    .replace(/[Я•]/g, (char) => `<span class="glyph-fallback">${char}</span>`)
}

// Envuelve un trozo de HTML en un enlace a Instagram (o lo deja igual si el
// artista no tiene cuenta).
function wrapInstagram(html, instagram, djName, clase) {
  if (!instagram) return html
  const handle = instagram.replace(/^@/, '')
  return `<a class="${clase}" href="https://instagram.com/${handle}" target="_blank" rel="noopener noreferrer" aria-label="Instagram de ${djName}">${html}</a>`
}

// El Instagram se muestra como texto (@usuario), no como icono: se lee de un
// vistazo a quién estás siguiendo y ocupa menos que un logo.
function renderInstagramLink(instagram, djName) {
  if (!instagram) return ''
  const handle = instagram.replace(/^@/, '')
  return `<a class="lineup__ig" href="https://instagram.com/${handle}" target="_blank" rel="noopener noreferrer" aria-label="Instagram de ${djName}">@${handle}</a>`
}

// El usuario va SIEMPRE encima del nombre del artista, en su propia línea:
// al lado quedaba pegado al nombre y competía con él (y en el póster se
// solapaba con el chip de BPM).
function renderNameWithInstagram(name, instagram) {
  const nombre = wrapInstagram(renderName(name), instagram, name, 'lineup__name-link')
  return `${renderInstagramLink(instagram, name)}${nombre}`
}

// Un set puede tener varios artistas (B2B): "Deif b2b Will•Y".
function renderArtists(artists) {
  return artists
    .map((artist) => renderNameWithInstagram(artist.name, artist.instagram))
    .join('<span class="lineup__b2b">b2b</span>')
}

// Cartel tipográfico de la cabecera (debajo del título): los artistas en
// grande, mayúsculas y negrita, con tamaños y estilos alternados para que
// parezca un cartel de fiesta y no una lista. El patrón es fijo (no aleatorio)
// para que cada carga se vea igual: recorre estos diez y vuelve a empezar.
const BILLING_PATTERN = [
  { size: 'xl', style: 'solid' },
  { size: 'md', style: 'outline' },
  { size: 'sm', style: 'accent' },
  { size: 'lg', style: 'solid' },
  { size: 'md', style: 'wide' },
  { size: 'xs', style: 'solid' },
  { size: 'lg', style: 'outline' },
  { size: 'sm', style: 'solid' },
  { size: 'md', style: 'accent' },
  { size: 'sm', style: 'wide' },
]

export function renderBilling(artistas) {
  const items = artistas
    .map(({ name, instagram }, index) => {
      const { size, style } = BILLING_PATTERN[index % BILLING_PATTERN.length]
      const contenido = wrapInstagram(renderName(name), instagram, name, 'billing__link')
      return `<li class="billing__item billing__item--${size} billing__item--${style}">${contenido}</li>`
    })
    .join('')

  return `<ul class="billing">${items}</ul>`
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
      ({ start, label, note, instagram }) => `
        ${renderDayHeading(start)}
        <li class="lineup__item lineup__item--open">
          <span class="lineup__time">
            <span class="lineup__time-range">${formatTime(start)} →</span>
            <span class="lineup__duration">${note || 'Indefinido'}</span>
          </span>
          <span class="lineup__name">${renderNameWithInstagram(label, instagram)}</span>
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
