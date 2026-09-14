// Datos extraídos de la base "FORMULARIO DJ'S" (Notion, tarea UMBRA-L #3).
// `arrival` es la hora de llegada declarada por cada DJ (UTC) — se conserva
// como referencia histórica, pero ya no determina el horario ni el orden:
// hay dos escenarios (`stage`: 'exterior' | 'interior') con su propio inicio
// fijo (ver src/schedule.js), y el orden dentro de cada uno es una selección
// manual (ver AGENTS.md: no arrancar con schranz, subir intensidad poco a
// poco). El orden en este array ES el orden de actuación.
// `bpm` es [mínimo, máximo], normalizado a partir del "Rango de BPMs" del
// formulario (venía en formatos distintos: "140-165", "145 a 160", "160"...).
export const djs = [
  // Exterior: 16:00–00:00 sábado. Empieza suave/groove, deja el schranz y el
  // hard techno más duro para las dos últimas horas.
  { name: 'Deif', genres: ['Techno Groove'], stage: 'exterior', arrival: '2026-10-04T11:00:00.000Z', bpm: [138, 148] },
  { name: 'FØBIA', genres: ['Hard bounce', 'Hypnotic groove', 'Groove bounce'], stage: 'exterior', arrival: '2026-10-03T22:00:00.000Z', bpm: [145, 160] },
  { name: 'Zai!', genres: ['Bounce Techno', 'HardTech'], stage: 'exterior', arrival: '2026-10-03T21:10:00.000Z', bpm: [140, 165] },
  { name: 'SKB', genres: ['Hardgroove'], stage: 'exterior', arrival: '2026-10-04T16:00:00.000Z', bpm: [145, 155] },
  { name: 'FLAMENKØ', genres: ['Hardbounce', 'Hardgroove'], stage: 'exterior', arrival: '2026-10-04T10:00:00.000Z', bpm: [140, 165] },
  { name: 'CARDAN', genres: ['Hardgroove', 'Acid Hard Techno'], stage: 'exterior', arrival: '2026-10-04T14:00:00.000Z', bpm: [145, 165] },
  { name: 'DRIWISH', genres: ['Schranz', 'Hardgroove'], stage: 'exterior', arrival: '2026-10-04T16:00:00.000Z', bpm: [140, 160] },
  { name: 'EmeGe', genres: ['Hard techno'], stage: 'exterior', arrival: '2026-10-03T22:00:00.000Z', bpm: [160, 180] },

  // Interior: 22:00–05:00. Abre con lo más melódico/bajo en BPM y cierra con
  // lo más intenso; el schranz no aparece hasta pasada la 01:00.
  { name: 'Eiren', genres: ['Techno', 'Hardgroove', 'Techouse'], stage: 'interior', arrival: '2026-10-04T19:00:00.000Z', bpm: [135, 148] },
  { name: 'Leks', genres: ['Hard Groove', 'Hard Techno'], stage: 'interior', arrival: '2026-10-04T18:00:00.000Z', bpm: [148, 160] },
  { name: 'NVЯR', genres: ['Hardgroove', 'Schranz', 'Hard dance'], stage: 'interior', arrival: '2026-10-04T14:30:00.000Z', bpm: [140, 170] },
  { name: 'K-BRY', genres: ['Hardtechno', 'Schranz'], stage: 'interior', arrival: '2026-10-04T08:00:00.000Z', bpm: [150, 160] },
  { name: 'Ann Blacksmith', genres: ['Hardtechno', 'Industrial', 'Bochka'], stage: 'interior', arrival: '2026-10-04T10:00:00.000Z', bpm: [160, 165] },
  { name: 'SENDA', genres: ['Hardtechno', 'Schranz'], stage: 'interior', arrival: '2026-10-04T08:00:00.000Z', bpm: [160, 160] },
  { name: 'Romaniko', genres: ['Acidcore', 'Tribe', 'Mental'], stage: 'interior', arrival: '2026-10-04T14:00:00.000Z', bpm: [160, 175] },
]
