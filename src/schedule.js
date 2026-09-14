const SET_MINUTES = 60

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000)
}

// Sets consecutivos de la misma duración, sin huecos, en el orden en que
// llegan en `djs` (la curación del orden vive en src/djs.js).
export function buildSchedule(djs, { eventStart, setMinutes = SET_MINUTES }) {
  let cursor = new Date(eventStart)
  return djs.map((dj) => {
    const start = new Date(cursor)
    const end = addMinutes(start, setMinutes)
    cursor = end
    return { name: dj.name, genres: dj.genres, bpm: dj.bpm, instagram: dj.instagram, start, end }
  })
}
