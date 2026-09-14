const dayFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  timeZone: 'Europe/Madrid',
})

const timeFormatter = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Madrid',
})

export function formatDay(date) {
  return dayFormatter.format(date)
}

export function formatTime(date) {
  return timeFormatter.format(date)
}

export function formatBpm([min, max]) {
  return min === max ? `${min} BPM` : `${min}–${max} BPM`
}

export function formatHours(ms) {
  const rounded = Math.round((ms / 3_600_000) * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`.replace('.', ',')
}

export function formatDuration(start, end) {
  const totalMinutes = Math.round((end - start) / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}min`
}
