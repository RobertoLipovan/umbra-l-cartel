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

export function uniqueGenres(djs) {
  const seen = new Set()
  const genres = []
  for (const dj of djs) {
    for (const genre of dj.genres) {
      const key = genre.trim().toLowerCase()
      if (!seen.has(key)) {
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

export function renderLineup(schedule, { id } = {}) {
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
          <span class="lineup__name">${slot.name}</span>
          <span class="lineup__genres">${slot.genres.join(' · ')}</span>
          <span class="lineup__bpm">${formatBpm(slot.bpm)}</span>
        </li>
      `
    })
    .join('')

  return `<ul class="lineup"${id ? ` id="${id}"` : ''}>${rows}</ul>`
}

export function renderHoursLine(schedule) {
  const totalMs = schedule[schedule.length - 1].end - schedule[0].start
  return `<p class="cartel__hours"><span class="cartel__hours-number">${formatHours(totalMs)}</span> horas de música ininterrumpida</p>`
}
