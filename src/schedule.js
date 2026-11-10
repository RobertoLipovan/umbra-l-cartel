// Convierte las horas locales ('HH:MM') del JSON a Date absolutos.
//
// El cartel es un único evento que cruza medianoche, así que no hace falta
// guardar la fecha en cada set: `event.day` da el día de inicio, y cualquier
// hora anterior a `event.nextDayBefore` ('12:00') se entiende del día
// siguiente. Es una regla simple y suficiente para este evento (nada empieza
// entre las 00:00 y las 12:00 salvo el tramo de madrugada).
//
// Nada de setHours/setDate aquí: esos métodos operan en la zona horaria del
// runtime, no en la del evento. Todo se resuelve construyendo el ISO con el
// desfase explícito (`2026-10-03T15:00:00+02:00`).
function addDays(isoDay, days) {
  // A mediodía UTC para que ningún salto de zona pueda cambiar el día.
  const date = new Date(`${isoDay}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function resolveTime(time, { day, utcOffset, nextDayBefore }) {
  const [hours] = time.split(':').map(Number)
  const [beforeHours] = nextDayBefore.split(':').map(Number)
  const slotDay = hours < beforeHours ? addDays(day, 1) : day

  return new Date(`${slotDay}T${time}:00${utcOffset}`)
}

// Los sets llegan ya en el orden del cartel (la curación vive en lineup.json).
export function buildSchedule(sets, event) {
  return sets.map((set) => ({
    start: resolveTime(set.start, event),
    end: resolveTime(set.end, event),
    artists: set.artists,
    genres: set.genres,
    bpm: set.bpm,
    tba: Boolean(set.tba),
  }))
}

// Huecos sin música entre sets consecutivos (p. ej. la pausa de 30 min a
// medianoche). No se pintan en el cartel, pero `renderHoursLine` los usa para
// no contar como música ininterrumpida.
export function findGaps(schedule) {
  const gaps = []
  for (let i = 1; i < schedule.length; i += 1) {
    const previous = schedule[i - 1]
    const current = schedule[i]
    if (current.start > previous.end) {
      gaps.push({ start: previous.end, end: current.start })
    }
  }
  return gaps
}
