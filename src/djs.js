// Datos extraídos de la base "FORMULARIO DJ'S" (Notion, tarea UMBRA-L #3).
// `arrival` es la hora de llegada declarada por cada DJ (UTC); ya no se usa
// para calcular horarios (el evento arranca fijo a las 17:00 del sábado, ver
// src/schedule.js), solo determina el orden de actuación entre ellos.
// `bpm` es [mínimo, máximo], normalizado a partir del "Rango de BPMs" del
// formulario (venía en formatos distintos: "140-165", "145 a 160", "160"...).
export const djs = [
  { name: 'Zai!', genres: ['Bounce Techno', 'HardTech'], arrival: '2026-10-03T21:10:00.000Z', bpm: [140, 165] },
  { name: 'FØBIA', genres: ['Hard bounce', 'Hypnotic groove', 'Groove bounce'], arrival: '2026-10-03T22:00:00.000Z', bpm: [145, 160] },
  { name: 'EmeGe', genres: ['Hard techno'], arrival: '2026-10-03T22:00:00.000Z', bpm: [160, 180] },
  { name: 'K-BRY', genres: ['Hardtechno', 'Schranz'], arrival: '2026-10-04T08:00:00.000Z', bpm: [150, 160] },
  { name: 'SENDA', genres: ['Hardtechno', 'Schranz'], arrival: '2026-10-04T08:00:00.000Z', bpm: [160, 160] },
  { name: 'FLAMENKØ', genres: ['Hardbounce', 'Hardgroove'], arrival: '2026-10-04T10:00:00.000Z', bpm: [140, 165] },
  { name: 'Ann Blacksmith', genres: ['Hardtechno', 'Industrial', 'Bochka'], arrival: '2026-10-04T10:00:00.000Z', bpm: [160, 165] },
  { name: 'Deif', genres: ['Techno Groove'], arrival: '2026-10-04T11:00:00.000Z', bpm: [138, 148] },
  { name: 'Romaniko', genres: ['Acidcore', 'Tribe', 'Mental'], arrival: '2026-10-04T14:00:00.000Z', bpm: [160, 175] },
  { name: 'CARDAN', genres: ['Hardgroove', 'Acid Hard Techno'], arrival: '2026-10-04T14:00:00.000Z', bpm: [145, 165] },
  { name: 'NVЯR', genres: ['Hardgroove', 'Schranz', 'Hard dance'], arrival: '2026-10-04T14:30:00.000Z', bpm: [140, 170] },
  { name: 'SKB', genres: ['Hardgroove'], arrival: '2026-10-04T16:00:00.000Z', bpm: [145, 155] },
  { name: 'DRIWISH', genres: ['Schranz', 'Hardgroove'], arrival: '2026-10-04T16:00:00.000Z', bpm: [140, 160] },
  { name: 'Leks', genres: ['Hard Groove', 'Techno', 'Hard Techno'], arrival: '2026-10-04T18:00:00.000Z', bpm: [148, 160] },
  // El formulario original decía 2026-10-09 (una semana después que el resto).
  // Confirmado como error de formulario: colocada al final de la jornada
  // del domingo a falta de confirmar la hora real con la DJ.
  { name: 'Eiren', genres: ['Techno', 'Hardgroove', 'Techouse'], arrival: '2026-10-04T19:00:00.000Z', bpm: [135, 148] },
]
