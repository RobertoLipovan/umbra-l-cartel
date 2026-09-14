const EVENT_START = new Date('2026-10-03T15:00:00.000Z') // 17:00 Madrid, sábado
const SET_MINUTES = 60

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000)
}

// Sets consecutivos de la misma duración empezando a las 17:00 del sábado,
// sin huecos entre uno y el siguiente. El orden de actuación viene de la
// hora de llegada declarada por cada DJ (solo para ordenarlos, ya no se usa
// para calcular horarios).
export function buildSchedule(djs, setMinutes = SET_MINUTES) {
  const sorted = [...djs].sort((a, b) => new Date(a.arrival) - new Date(b.arrival))

  let cursor = new Date(EVENT_START)
  return sorted.map((dj) => {
    const start = new Date(cursor)
    const end = addMinutes(start, setMinutes)
    cursor = end
    return { name: dj.name, genres: dj.genres, bpm: dj.bpm, start, end }
  })
}
