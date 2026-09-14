// Line-up corregido a mano por la organización (foto "line_up_rectificado_jefa"),
// sustituye a la curación automática por BPM que había antes. `stage`:
// 'exterior' | 'interior' fija en qué escenario toca cada uno; el orden en
// este array ES el orden de actuación, y algunos artistas repiten en ambos
// escenarios con géneros distintos (ver Eiren). `arrival` es la hora de
// llegada declarada por cada DJ (UTC) en el formulario original — se
// conserva solo como referencia histórica, no se usa para el horario.
// `bpm` es [mínimo, máximo]; ALES GUT aún no tiene datos de género/BPM.
// `instagram` (opcional) es el @ público del DJ — a diferencia de `arrival`,
// este SÍ está pensado para mostrarse (enlaza a su perfil desde el cartel).
export const djs = [
  // Exterior: 16:00–01:00 sábado.
  { name: 'Eiren', genres: ['Tech House'], stage: 'exterior', arrival: '2026-10-04T19:00:00.000Z', bpm: [135, 148], instagram: '@eiren.lf' },
  { name: 'Deif', genres: ['Techno Groove'], stage: 'exterior', arrival: '2026-10-04T11:00:00.000Z', bpm: [138, 148] },
  { name: 'Zai!', genres: ['Bounce Techno', 'HardTech'], stage: 'exterior', arrival: '2026-10-03T21:10:00.000Z', bpm: [140, 165] },
  { name: 'ALES GUT', genres: ['Por confirmar'], stage: 'exterior', bpm: ['?', '?'] },
  { name: 'SKB', genres: ['Hard Groove'], stage: 'exterior', arrival: '2026-10-04T16:00:00.000Z', bpm: [145, 155] },
  { name: 'FØBIA', genres: ['Hard bounce', 'Hypnotic groove', 'Groove bounce'], stage: 'exterior', arrival: '2026-10-03T22:00:00.000Z', bpm: [145, 160] },
  { name: 'Leks', genres: ['Hard Groove', 'Hard Techno'], stage: 'exterior', arrival: '2026-10-04T18:00:00.000Z', bpm: [148, 160] },

  // Interior: 23:00–07:00.
  { name: 'CARDAN', genres: ['Hard Groove', 'Acid Hard Techno'], stage: 'interior', arrival: '2026-10-04T14:00:00.000Z', bpm: [145, 165] },
  { name: 'Romaniko', genres: ['Acidcore', 'Tribe', 'Mental'], stage: 'interior', arrival: '2026-10-04T14:00:00.000Z', bpm: [160, 175] },
  { name: 'FLAMENKØ', genres: ['Hardbounce', 'Hard Groove'], stage: 'interior', arrival: '2026-10-04T10:00:00.000Z', bpm: [140, 165] },
  { name: 'SENDA', genres: ['Hardtechno', 'Schranz'], stage: 'interior', arrival: '2026-10-04T08:00:00.000Z', bpm: [160, 160] },
  { name: 'NVЯR', genres: ['Hard Groove', 'Schranz', 'Hard dance'], stage: 'interior', arrival: '2026-10-04T14:30:00.000Z', bpm: [140, 170] },
  { name: 'DRIWISH', genres: ['Schranz', 'Hard Groove'], stage: 'interior', arrival: '2026-10-04T16:00:00.000Z', bpm: [140, 160] },
  { name: 'EmeGe', genres: ['Hard techno'], stage: 'interior', arrival: '2026-10-03T22:00:00.000Z', bpm: [160, 180] },
  { name: 'Ann Blacksmith', genres: ['Hardtechno', 'Industrial', 'Bochka'], stage: 'interior', arrival: '2026-10-04T10:00:00.000Z', bpm: [160, 165] },
  { name: 'K-BRY', genres: ['Hardtechno', 'Schranz'], stage: 'interior', arrival: '2026-10-04T08:00:00.000Z', bpm: [150, 160] },
  { name: 'Eiren', genres: ['Hard Groove', 'Techno'], stage: 'interior', arrival: '2026-10-04T19:00:00.000Z', bpm: [135, 148], instagram: '@eiren.lf' },
  { name: 'NØT', genres: ['Groove', 'Hypnotic Techno'], stage: 'interior', arrival: '2026-10-03T17:00:00.000Z', bpm: [135, 145] },
]
