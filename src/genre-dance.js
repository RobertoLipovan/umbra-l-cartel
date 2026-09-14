const INTERVAL_MS = 500
const ACTIVE_COUNT = 5
const ACTIVE_CLASS = 'genres__item--active'

// Cada 500ms, 5 chips de género aleatorios pasan al estado "relleno" y los
// 5 de la ronda anterior vuelven al normal. La siguiente ronda evita repetir
// los mismos 5 (si hay suficientes chips para hacerlo).
export function startGenreDance() {
  const chips = Array.from(document.querySelectorAll('.genres__item'))
  if (chips.length === 0) return

  const pickCount = Math.min(ACTIVE_COUNT, chips.length)
  const allIndexes = chips.map((_, i) => i)
  let previous = new Set()

  function tick() {
    chips.forEach((chip) => chip.classList.remove(ACTIVE_CLASS))

    const available = allIndexes.filter((i) => !previous.has(i))
    const pool = available.length >= pickCount ? available : allIndexes

    const chosen = new Set()
    while (chosen.size < pickCount) {
      chosen.add(pool[Math.floor(Math.random() * pool.length)])
    }

    chosen.forEach((i) => chips[i].classList.add(ACTIVE_CLASS))
    previous = chosen
  }

  tick()
  setInterval(tick, INTERVAL_MS)
}
