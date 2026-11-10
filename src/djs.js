// El horario vive en src/lineup.json (fuente de verdad única: sets con hora
// explícita de inicio y fin). Antes se calculaba encadenando sets de 60 min
// desde una hora de arranque, pero el cartel real tiene bloques de 2h, un
// hueco de 30 min a medianoche y un cierre abierto, así que las horas van
// escritas a mano en el JSON.
//
// `start`/`end` son horas locales de Madrid sin fecha ('HH:MM'). La fecha del
// evento y el desfase están en `event`; `schedule.js` las convierte a Date.
// Un set cuya hora de inicio sea anterior a `event.nextDayBefore` pertenece al
// día siguiente (el evento cruza medianoche).
//
// Reglas de privacidad (ver AGENTS.md): nunca añadir al JSON datos internos
// como la hora de llegada declarada por el DJ. `instagram` sí es público.
import lineup from './lineup.json'

export const EVENT = lineup.event
export const STAGES = lineup.stages

// Registro plano de artistas (uno por artista, no por set) para lo que trabaja
// sobre el conjunto del cartel: chips de género de la portada, etc. `stage` es
// el escenario en el que toca; si un artista repite, aparece una vez por set.
export const djs = STAGES.flatMap((stage) =>
  stage.sets.flatMap((set) =>
    set.artists.map((artist) => ({
      name: artist.name,
      instagram: artist.instagram,
      stage: stage.id,
      genres: set.genres,
      bpm: set.bpm,
    })),
  ),
)

export function getStage(id) {
  return STAGES.find((stage) => stage.id === id)
}
