import './style.css'
import { djs } from './djs.js'
import { buildSchedule } from './schedule.js'
import { formatDay, formatTime, formatBpm, formatDuration, formatHours } from './format.js'

const schedule = buildSchedule(djs)

const totalHoursMs = schedule[schedule.length - 1].end - schedule[0].start

const seenGenres = new Set()
const genres = []
for (const dj of djs) {
  for (const genre of dj.genres) {
    const key = genre.trim().toLowerCase()
    if (!seenGenres.has(key)) {
      seenGenres.add(key)
      genres.push(genre)
    }
  }
}

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

const RETICLE_ICON = `
  <svg class="cartel__logo" width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="18" stroke="currentColor" stroke-width="3" stroke-dasharray="20 8" />
    <line x1="28" y1="2" x2="28" y2="14" stroke="currentColor" stroke-width="3" />
    <line x1="28" y1="42" x2="28" y2="54" stroke="currentColor" stroke-width="3" />
    <line x1="2" y1="28" x2="14" y2="28" stroke="currentColor" stroke-width="3" />
    <line x1="42" y1="28" x2="54" y2="28" stroke="currentColor" stroke-width="3" />
    <circle cx="28" cy="28" r="2.5" fill="currentColor" />
  </svg>
`

document.querySelector('#app').innerHTML = `
  <main class="cartel">
    <header class="cartel__header">
      ${RETICLE_ICON}
      <p class="cartel__kicker">Casa Techno 3.0</p>
      <h1 class="cartel__title">UMBRA-L</h1>
      <p class="cartel__hours"><span class="cartel__hours-number">${formatHours(totalHoursMs)}</span> horas de música ininterrumpida</p>

      <section class="genres">
        <ul class="genres__list">
          ${genres.map((genre) => `<li class="genres__item">${genre}</li>`).join('')}
        </ul>
      </section>

      <a class="cartel__scroll" href="#lineup">
        CARTEL
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 7L10 13L16 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </a>
    </header>

    <ul class="lineup" id="lineup">
      ${rows}
    </ul>

    <footer class="cartel__footer">✕ Desert Music Unity ✕</footer>
  </main>
`
